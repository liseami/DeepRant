/**
 * [INPUT]: store 设置与凭据迁移、shortcut 注册事务、ai_translator 模型管道、game_composer 独立输入会话。
 * [OUTPUT]: 受校验的设置/翻译/游戏输入 IPC；启动和 macOS Reopen 激活主窗口，浮窗关闭取消输入。
 * [POS]: 仅编排边界模块；WebView 不直接写文件，快捷键注册与持久化一起提交；日志限警告，避免依赖的调试日志记录聊天原文。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use tauri::Manager;
pub mod ai_translator;
mod composer_target;
pub mod credentials;
pub mod game_composer;
pub mod model_presets;
pub mod scenes;
pub mod shell_helper;
pub mod shortcut;
pub mod store;
pub mod tray;
#[cfg(test)]
mod updater_tests;

#[tauri::command]
fn get_version(app_handle: tauri::AppHandle) -> String {
    app_handle.package_info().version.to_string()
}

#[tauri::command]
async fn get_settings(app_handle: tauri::AppHandle) -> Result<store::AppSettings, String> {
    tauri::async_runtime::spawn_blocking(move || {
        store::get_settings(&app_handle).map_err(|e| e.to_string())
    })
    .await
    .map_err(|_| "设置任务被中断".to_string())?
}

#[tauri::command]
async fn update_settings(
    app_handle: tauri::AppHandle,
    patch: serde_json::Value,
) -> Result<store::AppSettings, String> {
    tauri::async_runtime::spawn_blocking(move || {
        store::update_settings(&app_handle, patch).map_err(|e| e.to_string())
    })
    .await
    .map_err(|_| "设置任务被中断".to_string())?
}

#[tauri::command]
async fn clear_api_key(app_handle: tauri::AppHandle) -> Result<store::AppSettings, String> {
    tauri::async_runtime::spawn_blocking(move || {
        store::clear_api_key(&app_handle).map_err(|e| e.to_string())
    })
    .await
    .map_err(|_| "凭据任务被中断".to_string())?
}

#[tauri::command]
async fn test_model_connection(app_handle: tauri::AppHandle) -> Result<String, String> {
    ai_translator::test_model_connection(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn translate_text(app_handle: tauri::AppHandle, text: String) -> Result<String, String> {
    ai_translator::translate_text(&app_handle, &text)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_shortcut_status() -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(shortcut::get_shortcut_status)
        .await
        .map_err(|_| "快捷键状态读取被中断".to_string())
}

async fn mutate_shortcuts(
    app: tauri::AppHandle,
    update: impl FnOnce(&mut store::AppSettings) -> Result<(), String> + Send + 'static,
) -> Result<store::AppSettings, String> {
    tauri::async_runtime::spawn_blocking(move || shortcut::change_shortcut_settings(&app, update))
        .await
        .map_err(|_| "快捷键设置任务被中断".to_string())?
}

#[tauri::command]
fn set_shortcuts_paused(paused: bool) {
    shortcut::set_shortcuts_paused(paused);
}

#[tauri::command]
async fn update_translator_shortcut(
    app_handle: tauri::AppHandle,
    keys: Vec<String>,
) -> Result<store::AppSettings, String> {
    let hotkey = shortcut::keys_to_hotkey(keys)?;
    mutate_shortcuts(app_handle, move |settings| {
        settings.trans_hotkey = hotkey;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn update_phrase(
    app_handle: tauri::AppHandle,
    id: i32,
    phrase: String,
) -> Result<store::AppSettings, String> {
    mutate_shortcuts(app_handle, move |settings| {
        let item = settings
            .phrases
            .iter_mut()
            .find(|p| p.id == id)
            .ok_or("常用语不存在，请刷新后重试")?;
        item.phrase = phrase;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn update_phrase_hotkey(
    app_handle: tauri::AppHandle,
    id: i32,
    keys: Vec<String>,
) -> Result<store::AppSettings, String> {
    let hotkey = shortcut::keys_to_hotkey(keys)?;
    mutate_shortcuts(app_handle, move |settings| {
        let item = settings
            .phrases
            .iter_mut()
            .find(|p| p.id == id)
            .ok_or("常用语不存在，请刷新后重试")?;
        item.hotkey = hotkey;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn set_phrase_enabled(
    app_handle: tauri::AppHandle,
    id: i32,
    enabled: bool,
) -> Result<store::AppSettings, String> {
    mutate_shortcuts(app_handle, move |settings| {
        let item = settings
            .phrases
            .iter_mut()
            .find(|p| p.id == id)
            .ok_or("常用语不存在，请刷新后重试")?;
        item.enabled = enabled;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn set_phrases_enabled(
    app_handle: tauri::AppHandle,
    enabled: bool,
) -> Result<store::AppSettings, String> {
    mutate_shortcuts(app_handle, move |settings| {
        settings.phrases_enabled = enabled;
        Ok(())
    })
    .await
}

#[tauri::command]
async fn add_phrase(
    app_handle: tauri::AppHandle,
    phrase: String,
) -> Result<store::AppSettings, String> {
    mutate_shortcuts(app_handle, move |settings| {
        if phrase.trim().is_empty() {
            return Err("请输入常用语".into());
        }
        let id = settings
            .phrases
            .iter()
            .map(|p| p.id)
            .max()
            .unwrap_or(0)
            .checked_add(1)
            .ok_or("常用语 ID 已耗尽")?;
        settings.phrases.push(store::Phrase {
            id,
            phrase,
            enabled: false,
            hotkey: store::HotkeyConfig {
                modifiers: vec![],
                key: String::new(),
                shortcut: String::new(),
            },
        });
        Ok(())
    })
    .await
}

#[tauri::command]
async fn delete_phrase(
    app_handle: tauri::AppHandle,
    id: i32,
) -> Result<store::AppSettings, String> {
    mutate_shortcuts(app_handle, move |settings| {
        if !settings.phrases.iter().any(|p| p.id == id) {
            return Err("常用语不存在，请刷新后重试".into());
        }
        settings.phrases.retain(|p| p.id != id);
        Ok(())
    })
    .await
}

fn show_main(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "macos")]
        let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            show_main(app)
        }))
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Warn)
                .build(),
        )
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle();
            if let Err(error) = store::initialize_settings(handle) {
                log::error!("初始化设置失败: {error}");
            }
            if let Err(error) = shortcut::init_shortcuts(handle) {
                log::warn!("快捷键注册失败: {error}");
            }
            tray::create_tray(handle)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "composer" {
                    api.prevent_close();
                    game_composer::close_requested(window.app_handle());
                } else if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_version,
            get_settings,
            update_settings,
            clear_api_key,
            test_model_connection,
            translate_text,
            get_shortcut_status,
            set_shortcuts_paused,
            update_translator_shortcut,
            update_phrase,
            update_phrase_hotkey,
            set_phrase_enabled,
            set_phrases_enabled,
            add_phrase,
            delete_phrase,
            game_composer::get_composer_session,
            game_composer::commit_composer,
            game_composer::cancel_composer
        ])
        .build(tauri::generate_context!())
        .expect("DeepRant desktop runtime failed")
        .run(|app, event| match event {
            tauri::RunEvent::Ready => show_main(app),
            #[cfg(target_os = "macos")]
            tauri::RunEvent::Reopen { .. } => show_main(app),
            _ => {}
        });
}
