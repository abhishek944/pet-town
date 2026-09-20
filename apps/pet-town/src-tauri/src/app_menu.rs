use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::tray::TrayIconBuilder;

pub fn install(app: &tauri::App) -> tauri::Result<()> {
    let preferences = MenuItemBuilder::with_id("preferences", "Settings…")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;
    let show_town = MenuItemBuilder::with_id("show-town", "Show Town").build(app)?;
    let hide_town = MenuItemBuilder::with_id("hide-town", "Hide Town").build(app)?;
    let app_menu = SubmenuBuilder::new(app, "Pet Town")
        .about(None)
        .separator()
        .item(&preferences)
        .item(&show_town)
        .item(&hide_town)
        .separator()
        .quit()
        .build()?;
    let menu = MenuBuilder::new(app).item(&app_menu).build()?;
    app.set_menu(menu)?;
    app.on_menu_event(|handle, event| match event.id().as_ref() {
        "preferences" => {
            let _ = crate::settings_window::open_internal(handle, None, None);
        }
        "show-town" => {
            let _ = crate::village_visibility::set(handle, true);
        }
        "hide-town" => {
            let _ = crate::village_visibility::set(handle, false);
        }
        _ => {}
    });
    let tray_settings = MenuItemBuilder::with_id("tray-settings", "Open Settings…").build(app)?;
    let tray_show = MenuItemBuilder::with_id("tray-show-town", "Show Town").build(app)?;
    let tray_hide = MenuItemBuilder::with_id("tray-hide-town", "Hide Town").build(app)?;
    let tray_quit = MenuItemBuilder::with_id("tray-quit", "Quit Pet Town").build(app)?;
    let tray_menu = MenuBuilder::new(app)
        .item(&tray_settings)
        .item(&tray_show)
        .item(&tray_hide)
        .separator()
        .item(&tray_quit)
        .build()?;
    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::AssetNotFound("default window icon".into()))?;
    TrayIconBuilder::new()
        .icon(icon)
        .tooltip("Pet Town")
        .menu(&tray_menu)
        .on_menu_event(|handle, event| match event.id().as_ref() {
            "tray-settings" => {
                let _ = crate::settings_window::open_internal(handle, None, None);
            }
            "tray-show-town" => {
                let _ = crate::village_visibility::set(handle, true);
            }
            "tray-hide-town" => {
                let _ = crate::village_visibility::set(handle, false);
            }
            "tray-quit" => handle.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}
