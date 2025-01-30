use crate::store::initialize_settings;
use tauri::Manager;
pub mod ai_translator;
pub mod shell_helper;
pub mod shortcut;
pub mod store;
pub mod tray;

#[tauri::command]
fn log_to_backend(message: String) {
    println!("Frontend Log: {}", message);
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

pub fn run() {
    println!("Starting application...");

    tauri::Builder::default()
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
            initialize_settings(&app.app_handle())?;
            println!("应用设置初始化完成");

            // 初始化所有快捷键
            println!("正在注册全局快捷键...");
            shortcut::init_shortcuts(&app.app_handle())?;
            println!("快捷键设置成功");

            // 创建AI模型托盘
            tray::create_tray(&app.app_handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            update_translator_shortcut,
            log_to_backend,
            get_settings
        ])
        // 监听窗口事件
        .on_window_event(|window, event| match event {
            // 当用户点击窗口关闭按钮时触发
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // 隐藏窗口而不是真正关闭它
                // 这样应用程序仍在后台运行,可以通过托盘图标重新打开
                window.hide().unwrap();
                // 在 macOS 上将应用从 Dock 栏移除
                // 这样可以让应用程序在后台运行时不占用 Dock 栏空间
                #[cfg(target_os = "macos")]
                let _ = window
                    .app_handle()
                    .set_activation_policy(tauri::ActivationPolicy::Accessory);
                // 阻止窗口真正关闭
                // 这样应用程序会继续在后台运行
                api.prevent_close();
            }
            // 忽略其他窗口事件
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
