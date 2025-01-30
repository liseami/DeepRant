use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::AppHandle;
use tauri::Manager;

pub fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    // let show_icon = Image::from_path("icons/window.png")?;
    // let quit_icon = Image::from_path("icons/quit.png")?;

    let show_i = MenuItem::with_id(app, "show", "打开主页面", true, None::<String>)?;

    // 添加检查更新菜单项
    let check_update_i = MenuItem::with_id(app, "check_update", "检查更新", true, None::<String>)?;

    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<String>)?;

    // 在菜单项中添加 check_update_i
    let menu = Menu::with_items(app, &[&show_i, &check_update_i, &quit_i])?;
    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    #[cfg(target_os = "macos")]
                    let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            "check_update" => {
                println!("检查更新菜单项被点击");
            }
            "quit" => {
                println!("quit menu item was clicked");
                app.exit(0);
            }
            _ => {
                println!("menu item {:?} not handled", event.id);
            }
        })
        .build(app)?;

    Ok(())
}
