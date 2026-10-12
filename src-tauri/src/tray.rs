/**
 * [INPUT]: Tauri 原生菜单、窗口和 WebView 更新事件。
 * [OUTPUT]: 打开应用、检查更新、退出三个托盘动作。
 * [POS]: 桌面生命周期入口；更新操作交给前端显式安装流程。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter};

pub fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Open DeepRant / 打开", true, None::<String>)?;
    let update = MenuItem::with_id(
        app,
        "check_update",
        "Check updates / 检查更新",
        true,
        None::<String>,
    )?;
    let quit = MenuItem::with_id(app, "quit", "Quit / 退出", true, None::<String>)?;
    let menu = Menu::with_items(app, &[&show, &update, &quit])?;
    let mut tray = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(true);
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.on_menu_event(|app, event| match event.id.as_ref() {
        "show" => crate::show_main(app),
        "check_update" => {
            crate::show_main(app);
            let _ = app.emit("deeprant://check-update", ());
        }
        "quit" => app.exit(0),
        _ => {}
    })
    .build(app)?;
    Ok(())
}
