/**
 * [INPUT]: 依赖 composer_target 的原应用身份与焦点恢复、shell_helper 的共享输入锁及 Unicode 输入、Tauri 独立 WebView
 * [OUTPUT]: 提供游戏输入浮窗打开、session 查询、提交与取消 IPC；deeprant://composer-open 只通知对应浮窗
 * [POS]: 不可复制聊天框的输入路径；会话持续占有输入锁，重复快捷键不更换目标，失败保留会话和前端草稿
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use crate::{composer_target, shell_helper::BusyGuard, store::AppSettings};
use anyhow::{anyhow, bail, Context, Result};
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Mutex,
};
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

const WINDOW: &str = "composer";
const MAX_COMPOSE_BYTES: usize = 16 * 1024;
static NEXT_SESSION: AtomicU64 = AtomicU64::new(1);
static SESSION: Mutex<State> = Mutex::new(State::Idle);

struct Session {
    id: u64,
    target: composer_target::ComposerTarget,
    _busy: BusyGuard,
}
enum State {
    Idle,
    Active(Session),
    Working(u64),
}
#[derive(Clone, serde::Serialize)]
pub struct SessionInfo {
    id: u64,
}

pub(crate) fn should_compose(settings: &AppSettings) -> bool {
    settings.input_mode == "compose"
        || (settings.input_mode == "auto" && !settings.daily_mode && settings.game_scene == "lol")
}

fn current_id() -> Result<u64> {
    match &*SESSION
        .lock()
        .map_err(|_| anyhow!("游戏输入会话被中断，请重启应用"))?
    {
        State::Idle => bail!("游戏输入会话已结束，请从游戏聊天框重新触发快捷键"),
        State::Active(session) => Ok(session.id),
        State::Working(id) => Ok(*id),
    }
}

fn show(app: &AppHandle, id: u64) -> Result<()> {
    let window = app
        .get_webview_window(WINDOW)
        .ok_or_else(|| anyhow!("游戏输入浮窗不可用"))?;
    window.show()?;
    window.set_focus()?;
    window.emit("deeprant://composer-open", SessionInfo { id })?;
    Ok(())
}

fn validate_window(window: &WebviewWindow) -> Result<()> {
    if window.label() != WINDOW {
        bail!("游戏输入命令仅允许来自输入浮窗");
    }
    Ok(())
}

/// 已有会话优先，不因主页切换输入方式而重新捕获目标。
pub(crate) fn focus_existing(app: &AppHandle) -> Result<bool> {
    let state = SESSION
        .lock()
        .map_err(|_| anyhow!("游戏输入会话被中断，请重启应用"))?;
    match &*state {
        State::Idle => Ok(false),
        State::Working(_) => Ok(true),
        State::Active(session) => {
            let id = session.id;
            drop(state);
            show(app, id)?;
            Ok(true)
        }
    }
}

pub(crate) async fn open(app: &AppHandle) -> Result<()> {
    let app = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        {
            let state = SESSION
                .lock()
                .map_err(|_| anyhow!("游戏输入会话被中断，请重启应用"))?;
            if let State::Active(session) = &*state {
                let id = session.id;
                drop(state);
                return show(&app, id);
            }
            if matches!(*state, State::Working(_)) {
                bail!("正在将译文填入游戏，请稍候");
            }
        }
        let busy = BusyGuard::acquire()?;
        let target = composer_target::ComposerTarget::capture()?;
        if !target.is_current() {
            bail!("打开浮窗前游戏焦点已改变，请从空聊天框重新触发快捷键");
        }
        let id = NEXT_SESSION.fetch_add(1, Ordering::Relaxed);
        if id == 0 {
            bail!("游戏输入会话编号已耗尽，请重启应用");
        }
        {
            let mut state = SESSION
                .lock()
                .map_err(|_| anyhow!("游戏输入会话被中断，请重启应用"))?;
            *state = State::Active(Session {
                id,
                target,
                _busy: busy,
            });
        }
        let opened = (|| -> Result<()> {
            if app.get_webview_window(WINDOW).is_none() {
                WebviewWindowBuilder::new(
                    &app,
                    WINDOW,
                    WebviewUrl::App("index.html#composer".into()),
                )
                .title("DeepRant 游戏输入")
                .inner_size(560.0, 520.0)
                .min_inner_size(420.0, 420.0)
                .resizable(true)
                .decorations(true)
                .always_on_top(true)
                .visible(false)
                .build()?;
            }
            show(&app, id)
        })();
        if opened.is_err() {
            let mut state = SESSION
                .lock()
                .map_err(|_| anyhow!("游戏输入会话被中断，请重启应用"))?;
            if matches!(&*state, State::Active(session) if session.id == id) {
                *state = State::Idle;
            }
            if let Some(window) = app.get_webview_window(WINDOW) {
                let _ = window.hide();
            }
        }
        opened
    })
    .await
    .context("打开游戏输入任务被中断")?
}

fn take_session(id: u64) -> Result<Session> {
    let mut state = SESSION
        .lock()
        .map_err(|_| anyhow!("游戏输入会话被中断，请重启应用"))?;
    match &*state {
        State::Active(session) if session.id == id => {}
        State::Working(current) if *current == id => bail!("当前输入会话正在处理，请稍候"),
        _ => bail!("输入会话已过期，当前草稿未提交；请重新触发游戏快捷键"),
    }
    let State::Active(session) = std::mem::replace(&mut *state, State::Working(id)) else {
        unreachable!()
    };
    Ok(session)
}

fn validate_text(text: &str) -> Result<()> {
    if text.trim().is_empty()
        || text.len() > MAX_COMPOSE_BYTES
        || text
            .chars()
            .any(|character| character.is_control() || matches!(character, '\u{2028}' | '\u{2029}'))
    {
        bail!("只能填入非空的单行译文，最多 16 KiB；请删除换行与控制字符");
    }
    Ok(())
}

fn finish(app: &AppHandle, session_id: u64, text: Option<String>) -> Result<()> {
    if let Some(text) = &text {
        validate_text(text)?;
    }
    let session = take_session(session_id)?;
    let cancelled = text.is_none();
    let result = (|| -> Result<()> {
        let window = app
            .get_webview_window(WINDOW)
            .ok_or_else(|| anyhow!("游戏输入浮窗不可用，草稿未提交"))?;
        window.hide()?;
        composer_target::restore(&session.target)?;
        if let Some(text) = text {
            crate::shell_helper::type_composed_text(&text, || {
                if !session.target.is_current() {
                    bail!("游戏焦点已改变，停止填入译文；请检查聊天框后重试");
                }
                Ok(())
            })?;
        }
        Ok(())
    })();
    {
        let mut state = SESSION
            .lock()
            .map_err(|_| anyhow!("游戏输入会话被中断，请重启应用"))?;
        // Working 时拒绝其他 token；提交失败保留原目标；明确取消即使原目标已退出也释放输入锁。
        *state = if result.is_ok() || cancelled {
            State::Idle
        } else {
            State::Active(session)
        };
    }
    if cancelled {
        if let Err(error) = result {
            log::warn!("取消游戏输入后无法恢复原窗口: {error}");
        }
        return Ok(());
    }
    if result.is_err() {
        let _ = show(app, session_id);
    }
    result
}

#[tauri::command]
pub fn get_composer_session(window: WebviewWindow) -> Result<SessionInfo, String> {
    validate_window(&window)
        .and_then(|_| current_id())
        .map(|id| SessionInfo { id })
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn commit_composer(
    window: WebviewWindow,
    session_id: u64,
    text: String,
) -> Result<(), String> {
    validate_window(&window).map_err(|error| error.to_string())?;
    let app = window.app_handle().clone();
    tauri::async_runtime::spawn_blocking(move || finish(&app, session_id, Some(text)))
        .await
        .map_err(|_| "游戏输入任务被中断".to_string())?
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn cancel_composer(window: WebviewWindow, session_id: u64) -> Result<(), String> {
    validate_window(&window).map_err(|error| error.to_string())?;
    let app = window.app_handle().clone();
    tauri::async_runtime::spawn_blocking(move || finish(&app, session_id, None))
        .await
        .map_err(|_| "取消游戏输入任务被中断".to_string())?
        .map_err(|error| error.to_string())
}

pub(crate) fn close_requested(app: &AppHandle) {
    let app = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        if let Ok(id) = current_id() {
            if let Err(error) = finish(&app, id, None) {
                crate::shell_helper::report_status(&app, "error", &error.to_string());
            }
        } else if let Some(window) = app.get_webview_window(WINDOW) {
            let _ = window.hide();
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn composer_routes_only_explicit_mode_or_game_lol_and_never_accepts_send_controls() {
        let mut settings = AppSettings {
            game_scene: "lol".into(),
            ..AppSettings::default()
        };
        assert!(should_compose(&settings));
        settings.daily_mode = true;
        assert!(!should_compose(&settings));
        settings.input_mode = "compose".into();
        assert!(should_compose(&settings));
        settings.input_mode = "replace".into();
        assert!(!should_compose(&settings));
        for invalid in [
            "",
            " ",
            "text\n",
            "text\r",
            "text\t",
            "text\0",
            "text\u{2028}",
        ] {
            assert!(validate_text(invalid).is_err());
        }
        assert!(validate_text("你好 team — go mid").is_ok());
        assert!(validate_text(&"x".repeat(MAX_COMPOSE_BYTES + 1)).is_err());
    }
}
