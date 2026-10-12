/**
 * [INPUT]: shell_helper 实时权限、shortcut 真实注册状态、输入阶段与 inline_translation 内存恢复标志。
 * [OUTPUT]: 提供 get_input_diagnostics、open_input_permissions 和仅内存的最近输入快照。
 * [POS]: 后台热键的可观察边界；不持有聊天文本或 Key，只打开固定系统设置入口，授权由用户完成。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::sync::Mutex;
use tauri::AppHandle;
#[cfg(target_os = "macos")]
use tauri_plugin_opener::OpenerExt;

#[derive(Clone, serde::Serialize)]
pub struct InputStatus {
    state: String,
    message: String,
}

#[derive(serde::Serialize)]
pub struct InputDiagnostics {
    accessibility_granted: Option<bool>,
    shortcuts_registered: bool,
    shortcut_error: Option<String>,
    last_input: Option<InputStatus>,
    recovery_available: bool,
}

static LAST_INPUT: Mutex<Option<InputStatus>> = Mutex::new(None);

pub(crate) fn record(state: &str, message: &str) {
    if let Ok(mut status) = LAST_INPUT.lock() {
        *status = Some(InputStatus {
            state: state.to_string(),
            message: message.to_string(),
        });
    }
}

#[tauri::command]
pub async fn get_input_diagnostics() -> Result<InputDiagnostics, String> {
    tauri::async_runtime::spawn_blocking(|| {
        Ok(InputDiagnostics {
            accessibility_granted: crate::shell_helper::accessibility_granted(),
            shortcuts_registered: crate::shortcut::shortcuts_registered(),
            shortcut_error: crate::shortcut::get_shortcut_status(),
            recovery_available: crate::inline_translation::recovery_available(),
            last_input: LAST_INPUT
                .lock()
                .map_err(|_| "输入诊断状态被中断，请重启应用".to_string())?
                .clone(),
        })
    })
    .await
    .map_err(|_| "输入诊断任务被中断".to_string())?
}

#[tauri::command]
pub fn open_input_permissions(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        app.opener()
            .open_url(
                "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
                None::<&str>,
            )
            .map_err(|_| "无法打开辅助功能设置，请在系统设置 → 隐私与安全性中打开".to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Err("此平台没有 macOS 辅助功能设置入口".to_string())
    }
}
