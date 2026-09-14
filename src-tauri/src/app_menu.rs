use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::tray::TrayIconBuilder;

pub fn install(app: &tauri::App) -> tauri::Result<()> {
    let preferences = MenuItemBuilder::with_id("preferences", "Settings…")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;
    let app_menu = SubmenuBuilder::new(app, "Pet Village")
        .about(None)
        .separator()
        .item(&preferences)
        .separator()
        .quit()
        .build()?;
    let menu = MenuBuilder::new(app).item(&app_menu).build()?;
    app.set_menu(menu)?;
    app.on_menu_event(|handle, event| {
        if event.id().as_ref() == "preferences" {
            let _ = crate::settings_window::open_internal(handle, None);
        }
    });
    let tray_settings = MenuItemBuilder::with_id("tray-settings", "Open Settings…").build(app)?;
    let tray_quit = MenuItemBuilder::with_id("tray-quit", "Quit Pet Village").build(app)?;
    let tray_menu = MenuBuilder::new(app)
        .item(&tray_settings)
        .separator()
        .item(&tray_quit)
        .build()?;
    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::AssetNotFound("default window icon".into()))?;
    TrayIconBuilder::new()
        .icon(icon)
        .tooltip("Pet Village")
        .menu(&tray_menu)
        .on_menu_event(|handle, event| match event.id().as_ref() {
            "tray-settings" => {
                let _ = crate::settings_window::open_internal(handle, None);
            }
            "tray-quit" => handle.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}
