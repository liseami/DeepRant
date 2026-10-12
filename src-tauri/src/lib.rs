/**
 * [INPUT]: 依赖 store 初始化、shortcut 注册、tray 创建、provider 测连
 * [OUTPUT]: 暴露设置、快捷键、常用语与模型测连命令；启动整个 Tauri 应用
 * [POS]: 后端入口。新命令只在这里登记，实现放回各模块。
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

use crate::store::initialize_settings;
use tauri::Manager;
pub mod ai_translator;
pub mod scenes;
pub mod shell_helper;
pub mod shortcut;
pub mod store;
pub mod tray;

#[tauri::command]
fn log_to_backend(message: String) {
    println!("Frontend Log: {}", message);
}

#[tauri::command]
fn get_version(app_handle: tauri::AppHandle) -> String {
    app_handle.package_info().version.to_string()
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn update_translator_shortcut(
    app_handle: tauri::AppHandle,
    keys: Vec<String>,
) -> Result<(), String> {
    shortcut::update_translator_shortcut(&app_handle, keys)
}

#[tauri::command]
async fn get_settings(app_handle: tauri::AppHandle) -> Result<store::AppSettings, String> {
    store::get_settings(&app_handle).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_phrase(
    app_handle: tauri::AppHandle,
    id: i32,
    phrase: String,
) -> Result<store::AppSettings, String> {
    store::update_phrase_text(&app_handle, id, phrase).map_err(|e| e.to_string())?;
    store::get_settings(&app_handle).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_phrase_hotkey(
    app_handle: tauri::AppHandle,
    id: i32,
    keys: Vec<String>,
) -> Result<store::AppSettings, String> {
    let hotkey = shortcut::keys_to_hotkey(keys)?;
    store::update_phrase_hotkey(&app_handle, id, hotkey).map_err(|e| e.to_string())?;
    shortcut::reload_shortcuts(&app_handle)?;
    store::get_settings(&app_handle).map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_phrase_enabled(
    app_handle: tauri::AppHandle,
    id: i32,
    enabled: bool,
) -> Result<store::AppSettings, String> {
    store::set_phrase_enabled(&app_handle, id, enabled).map_err(|e| e.to_string())?;
    shortcut::reload_shortcuts(&app_handle)?;
    store::get_settings(&app_handle).map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_phrases_enabled(
    app_handle: tauri::AppHandle,
    enabled: bool,
) -> Result<store::AppSettings, String> {
    store::set_phrases_enabled(&app_handle, enabled).map_err(|e| e.to_string())?;
    shortcut::reload_shortcuts(&app_handle)?;
    store::get_settings(&app_handle).map_err(|e| e.to_string())
}

#[tauri::command]
async fn test_model_connection(
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    ai_translator::test_model_connection(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

pub fn run() {
    println!("Starting application...");

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        // 剪贴板插件
        .plugin(tauri_plugin_clipboard_manager::init())
        // opener插件
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 初始化存储
            println!("Initializing...");
            match initialize_settings(&app.app_handle()) {
                Ok(_) => println!("应用设置初始化完成"),
                Err(e) => eprintln!("初始化设置失败: {}", e),
            }

            // 初始化所有快捷键
            println!("正在注册全局快捷键...");
            match shortcut::init_shortcuts(&app.app_handle()) {
                Ok(_) => println!("快捷键设置成功"),
                Err(e) => eprintln!("注册全局快捷键失败: {}", e),
            }

            // 创建AI模型托盘
            match tray::create_tray(&app.app_handle()) {
                Ok(_) => println!("托盘创建成功"),
                Err(e) => eprintln!("创建托盘失败: {}", e),
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            update_translator_shortcut,
            log_to_backend,
            get_settings,
            get_version,
            update_phrase,
            update_phrase_hotkey,
            set_phrase_enabled,
            set_phrases_enabled,
            test_model_connection
        ]);

    // 只在非Windows系统上添加窗口事件监听
    #[cfg(not(target_os = "windows"))]
    {
        builder = builder.on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                window.hide().unwrap();
                #[cfg(target_os = "macos")]
                let _ = window
                    .app_handle()
                    .set_activation_policy(tauri::ActivationPolicy::Accessory);
                api.prevent_close();
            }
            _ => {}
        });
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
