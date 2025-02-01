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

    let mut builder = tauri::Builder::default()
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
            let settings_result = initialize_settings(&app.app_handle());
            match settings_result {
                Ok(_) => println!("应用设置初始化完成"),
                Err(e) => println!("应用设置初始化失败: {:?}", e),
            }

            // 初始化所有快捷键
            println!("正在注册全局快捷键...");
            let shortcuts_result = shortcut::init_shortcuts(&app.app_handle());
            match shortcuts_result {
                Ok(_) => println!("快捷键设置成功"),
                Err(e) => println!("快捷键设置失败: {:?}", e),
            }

            // 只在非Windows系统上创建托盘
            #[cfg(not(target_os = "windows"))]
            {
                let tray_result = tray::create_tray(&app.app_handle());
                match tray_result {
                    Ok(_) => println!("托盘创建成功"),
                    Err(e) => println!("托盘创建失败: {:?}", e),
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            update_translator_shortcut,
            log_to_backend,
            get_settings
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
