use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::tray::TrayIconBuilder;

pub fn install(app: &tauri::App) -> tauri::Result<()> {
    let preferences = MenuItemBuilder::with_id("preferences", "Settings")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;
    let setup = MenuItemBuilder::with_id("onboarding", "Welcome & setup…").build(app)?;
    let open_3d_town = MenuItemBuilder::with_id("open-3d-town", "Open Pet Town").build(app)?;
    let close_3d_town = MenuItemBuilder::with_id("close-3d-town", "Close Pet Town").build(app)?;
    let show_town = MenuItemBuilder::with_id("show-town", "Show Pet Street").build(app)?;
    let hide_town = MenuItemBuilder::with_id("hide-town", "Hide Pet Street").build(app)?;
    let app_menu = SubmenuBuilder::new(app, "Pet Town")
        .about(None)
        .separator()
        .item(&preferences)
        .item(&setup)
        .item(&open_3d_town)
        .item(&close_3d_town)
        .item(&show_town)
        .item(&hide_town)
        .separator()
        .quit()
        .build()?;
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;
    let help_setup = MenuItemBuilder::with_id("help-onboarding", "Welcome & setup…").build(app)?;
    let help_menu = SubmenuBuilder::new(app, "Help").item(&help_setup).build()?;
    let menu = MenuBuilder::new(app)
        .item(&app_menu)
        .item(&edit_menu)
        .item(&help_menu)
        .build()?;
    app.set_menu(menu)?;
    app.on_menu_event(|handle, event| handle_event(handle, event.id().as_ref()));
    #[cfg(target_os = "macos")]
    super::dock_menu::install(app.handle())?;
    let tray_settings = MenuItemBuilder::with_id("tray-settings", "Settings").build(app)?;
    let tray_open_3d = MenuItemBuilder::with_id("tray-open-3d-town", "Open Pet Town").build(app)?;
    let tray_close_3d =
        MenuItemBuilder::with_id("tray-close-3d-town", "Close Pet Town").build(app)?;
    let tray_show = MenuItemBuilder::with_id("tray-show-town", "Show Pet Street").build(app)?;
    let tray_hide = MenuItemBuilder::with_id("tray-hide-town", "Hide Pet Street").build(app)?;
    let tray_quit = MenuItemBuilder::with_id("tray-quit", "Quit Pet Town").build(app)?;
    let tray_menu = MenuBuilder::new(app)
        .item(&tray_settings)
        .item(&tray_open_3d)
        .item(&tray_close_3d)
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
        .build(app)?;
    Ok(())
}

pub(crate) fn handle_event(app: &tauri::AppHandle, id: &str) {
    let result = match id {
        "onboarding" | "help-onboarding" => crate::onboarding::window::open(app),
        "tray-quit" => {
            app.exit(0);
            Ok(())
        }
        _ => action(app, id),
    };
    if let Err(error) = result {
        eprintln!("Pet Town menu action failed: {error}");
    }
}

pub(crate) fn action(app: &tauri::AppHandle, id: &str) -> Result<(), String> {
    match id {
        "preferences" | "tray-settings" => crate::settings_window::open_internal(app, None, None),
        "open-3d-town" | "tray-open-3d-town" => crate::town_process::open(app),
        "close-3d-town" | "tray-close-3d-town" => crate::town_process::close(app),
        "show-town" | "tray-show-town" => crate::village_visibility::set(app, true).map(|_| ()),
        "hide-town" | "tray-hide-town" => crate::village_visibility::set(app, false).map(|_| ()),
        _ => Ok(()),
    }
}
