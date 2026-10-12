/**
 * [INPUT]: 官方 updater 的配置、公钥与签名版本校验，以及主窗口的检查/安装/关闭/重启意图。
 * [OUTPUT]: 提供仅主窗口可调用的更新命令与 deeprant://update-state 可序列化快照。
 * [POS]: 更新资源、忙态、累计进度与安装生命周期的唯一权威；WebView 不持有 Update 或下载字节。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use serde::Serialize;
use std::{sync::Mutex, time::Duration};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use tauri_plugin_updater::{Update, UpdaterExt};

const STATE_EVENT: &str = "deeprant://update-state";

#[derive(Clone, Copy, Default, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
enum Phase {
    #[default]
    Idle,
    Checking,
    Available,
    Downloading,
    Installing,
    Installed,
    Latest,
    Error,
}

#[derive(Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSnapshot {
    revision: u64,
    update_id: u64,
    phase: Phase,
    version: Option<String>,
    body: Option<String>,
    downloaded_bytes: u64,
    total_bytes: Option<u64>,
    percent: Option<u8>,
    error: Option<String>,
}

#[derive(Default)]
struct UpdateSession {
    snapshot: UpdateSnapshot,
    update: Option<Update>,
}

#[derive(Default)]
pub struct DesktopUpdates {
    inner: Mutex<UpdateSession>,
}

impl UpdateSession {
    fn busy(&self) -> bool {
        matches!(
            self.snapshot.phase,
            Phase::Checking | Phase::Downloading | Phase::Installing | Phase::Installed
        )
    }

    fn publish(&mut self, app: &AppHandle) -> UpdateSnapshot {
        self.snapshot.revision = self.snapshot.revision.saturating_add(1);
        let snapshot = self.snapshot.clone();
        // -------- 同一锁内发布，命令结果与事件共享单调快照 --------
        let _ = app.emit_to("main", STATE_EVENT, &snapshot);
        snapshot
    }

    fn require_selection(&self, update_id: u64, version: &str) -> Result<(), String> {
        if self.snapshot.update_id != update_id || self.snapshot.version.as_deref() != Some(version)
        {
            return Err("更新选项已过期，请使用当前显示的版本".into());
        }
        Ok(())
    }
}

fn require_main(window: &WebviewWindow) -> Result<(), String> {
    if window.label() == "main" {
        Ok(())
    } else {
        Err("只有主窗口可以管理应用更新".into())
    }
}

#[tauri::command]
pub fn get_desktop_update_state(
    window: WebviewWindow,
    app: AppHandle,
) -> Result<UpdateSnapshot, String> {
    require_main(&window)?;
    let state = app.state::<DesktopUpdates>();
    let session = state.inner.lock().map_err(|_| "更新状态不可用")?;
    Ok(session.snapshot.clone())
}

#[tauri::command]
pub async fn check_desktop_updates(
    window: WebviewWindow,
    app: AppHandle,
) -> Result<UpdateSnapshot, String> {
    require_main(&window)?;
    {
        let state = app.state::<DesktopUpdates>();
        let mut session = state.inner.lock().map_err(|_| "更新状态不可用")?;
        if session.busy() {
            return Ok(session.snapshot.clone());
        }
        let update_id = session
            .snapshot
            .update_id
            .checked_add(1)
            .ok_or("更新编号已耗尽")?;
        let revision = session.snapshot.revision;
        // -------- 重查释放原生资源，不进入 WebView resource table --------
        session.update = None;
        session.snapshot = UpdateSnapshot {
            update_id,
            revision,
            phase: Phase::Checking,
            ..Default::default()
        };
        session.publish(&app);
    }

    let result = async {
        let updater = app
            .updater_builder()
            .timeout(Duration::from_secs(30))
            .build()?;
        let mut update = updater.check().await?;
        if let Some(next) = &mut update {
            if next.download_url.scheme() != "https" {
                return Err(tauri_plugin_updater::Error::InsecureTransportProtocol);
            }
            next.timeout = Some(Duration::from_secs(300));
        }
        Ok::<_, tauri_plugin_updater::Error>(update)
    }
    .await;

    let state = app.state::<DesktopUpdates>();
    let mut session = state.inner.lock().map_err(|_| "更新状态不可用")?;
    match result {
        Ok(update) => {
            session.snapshot.phase = if update.is_some() {
                Phase::Available
            } else {
                Phase::Latest
            };
            session.snapshot.version = update.as_ref().map(|next| next.version.clone());
            session.snapshot.body = update.as_ref().and_then(|next| next.body.clone());
            session.update = update;
            Ok(session.publish(&app))
        }
        Err(error) => {
            let message = format!("检查更新失败：{error}");
            session.snapshot.phase = Phase::Error;
            session.snapshot.error = Some(message.clone());
            session.publish(&app);
            Err(message)
        }
    }
}

#[tauri::command]
pub async fn install_desktop_update(
    window: WebviewWindow,
    app: AppHandle,
    update_id: u64,
    version: String,
) -> Result<UpdateSnapshot, String> {
    require_main(&window)?;
    let update = {
        let state = app.state::<DesktopUpdates>();
        let mut session = state.inner.lock().map_err(|_| "更新状态不可用")?;
        session.require_selection(update_id, &version)?;
        if session.snapshot.phase != Phase::Available {
            return Err("当前更新不可安装，请等待当前任务完成".into());
        }
        let update = session
            .update
            .as_ref()
            .ok_or("更新资源已释放，请重新检查")?;
        if update.version != version {
            return Err("更新资源与显示版本不一致，请重新检查".into());
        }
        let update = update.clone();
        session.snapshot.phase = Phase::Downloading;
        session.snapshot.error = None;
        session.snapshot.downloaded_bytes = 0;
        session.snapshot.total_bytes = None;
        session.snapshot.percent = None;
        session.publish(&app);
        update
    };

    // -------- 官方 download 先核验签名与版本；仅验证后的字节能进入 install --------
    let bytes = update
        .download(
            |length, total| {
                let state = app.state::<DesktopUpdates>();
                if let Ok(mut session) = state.inner.lock() {
                    session.snapshot.downloaded_bytes = session
                        .snapshot
                        .downloaded_bytes
                        .saturating_add(length as u64);
                    session.snapshot.total_bytes = total;
                    let percent = total.filter(|total| *total > 0).map(|total| {
                        ((u128::from(session.snapshot.downloaded_bytes) * 100 / u128::from(total))
                            .min(100)) as u8
                    });
                    // 只推送百分比变化；未知长度仍由 Rust 累计真实字节。
                    if session.snapshot.percent != percent {
                        session.snapshot.percent = percent;
                        session.publish(&app);
                    }
                };
            },
            || {},
        )
        .await;

    let result = match bytes {
        Ok(bytes) => {
            {
                let state = app.state::<DesktopUpdates>();
                let mut session = state.inner.lock().map_err(|_| "更新状态不可用")?;
                session.snapshot.phase = Phase::Installing;
                session.snapshot.percent = Some(100);
                session.publish(&app);
            }
            // 安装含磁盘替换/解包，留在后台；Windows 官方安装器负责退出与重启。
            tauri::async_runtime::spawn_blocking(move || update.install(bytes))
                .await
                .map_err(|_| "安装更新任务被中断".to_string())
                .and_then(|result| result.map_err(|error| format!("安装更新失败：{error}")))
        }
        Err(error) => Err(format!("下载或验证更新失败：{error}")),
    };

    let snapshot = {
        let state = app.state::<DesktopUpdates>();
        let mut session = state.inner.lock().map_err(|_| "更新状态不可用")?;
        match result {
            Ok(()) => {
                session.update = None;
                session.snapshot.phase = Phase::Installed;
                session.publish(&app)
            }
            Err(message) => {
                session.snapshot.phase = Phase::Available;
                session.snapshot.error = Some(message.clone());
                session.publish(&app);
                return Err(message);
            }
        }
    };
    app.request_restart();
    Ok(snapshot)
}

#[tauri::command]
pub fn dismiss_desktop_update(
    window: WebviewWindow,
    app: AppHandle,
    update_id: u64,
) -> Result<UpdateSnapshot, String> {
    require_main(&window)?;
    let state = app.state::<DesktopUpdates>();
    let mut session = state.inner.lock().map_err(|_| "更新状态不可用")?;
    if session.snapshot.update_id != update_id {
        return Err("更新选项已过期，请刷新后重试".into());
    }
    if session.busy() {
        return Err("当前更新任务尚未结束".into());
    }
    session.update = None;
    session.snapshot.phase = Phase::Idle;
    session.snapshot.version = None;
    session.snapshot.body = None;
    session.snapshot.error = None;
    Ok(session.publish(&app))
}

#[tauri::command]
pub fn restart_after_desktop_update(
    window: WebviewWindow,
    app: AppHandle,
    update_id: u64,
    version: String,
) -> Result<(), String> {
    require_main(&window)?;
    {
        let state = app.state::<DesktopUpdates>();
        let session = state.inner.lock().map_err(|_| "更新状态不可用")?;
        session.require_selection(update_id, &version)?;
        if session.snapshot.phase != Phase::Installed {
            return Err("更新尚未安装，不能请求更新重启".into());
        }
    }
    app.request_restart();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{Phase, UpdateSession, UpdateSnapshot};

    #[test]
    fn stale_selection_cannot_install_or_restart_a_newly_checked_release() {
        let mut session = UpdateSession {
            snapshot: UpdateSnapshot {
                update_id: 2,
                version: Some("2.1.0".into()),
                phase: Phase::Available,
                ..Default::default()
            },
            ..Default::default()
        };
        assert!(session.require_selection(1, "2.1.0").is_err());
        assert!(session.require_selection(2, "2.0.1").is_err());
        assert!(session.require_selection(2, "2.1.0").is_ok());
        assert!(!session.busy());
        session.snapshot.phase = Phase::Downloading;
        assert!(session.busy());
        session.snapshot.phase = Phase::Installed;
        assert!(session.busy());
    }
}
