use tauri::menu::{Menu, MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Wry};

fn application_menu(app: &AppHandle, town: bool) -> tauri::Result<Menu<Wry>> {
    let preferences = MenuItemBuilder::with_id("preferences", "Settings")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;
    let setup = MenuItemBuilder::with_id("onboarding", "Welcome & setup…").build(app)?;
    let mut section = SubmenuBuilder::new(app, "Pet Town")
        .about(None)
        .separator()
        .item(&preferences)
        .item(&setup);
    if town {
        let open = MenuItemBuilder::with_id("open-3d-town", "Open Pet Town").build(app)?;
        let close = MenuItemBuilder::with_id("close-3d-town", "Close Pet Town").build(app)?;
        section = section.item(&open).item(&close);
    }
    let show = MenuItemBuilder::with_id("show-town", "Show Pet Street").build(app)?;
    let hide = MenuItemBuilder::with_id("hide-town", "Hide Pet Street").build(app)?;
    let section = section.item(&show).item(&hide).separator().quit().build()?;
    let edit = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;
    let help_setup = MenuItemBuilder::with_id("help-onboarding", "Welcome & setup…").build(app)?;
    let help = SubmenuBuilder::new(app, "Help").item(&help_setup).build()?;
    MenuBuilder::new(app)
        .item(&section)
        .item(&edit)
        .item(&help)
        .build()
}

fn tray_menu(app: &AppHandle, town: bool) -> tauri::Result<Menu<Wry>> {
    let settings = MenuItemBuilder::with_id("tray-settings", "Settings").build(app)?;
    let mut menu = MenuBuilder::new(app).item(&settings);
    if town {
        let open = MenuItemBuilder::with_id("tray-open-3d-town", "Open Pet Town").build(app)?;
        let close = MenuItemBuilder::with_id("tray-close-3d-town", "Close Pet Town").build(app)?;
        menu = menu.item(&open).item(&close);
    }
    let show = MenuItemBuilder::with_id("tray-show-town", "Show Pet Street").build(app)?;
    let hide = MenuItemBuilder::with_id("tray-hide-town", "Hide Pet Street").build(app)?;
    let quit = MenuItemBuilder::with_id("tray-quit", "Quit Pet Town").build(app)?;
    menu.item(&show).item(&hide).separator().item(&quit).build()
}

pub fn install(app: &tauri::App) -> tauri::Result<()> {
    let handle = app.handle();
    let town = crate::town_install::available(handle) || crate::godot_bridge::running(handle);
    app.set_menu(application_menu(handle, town)?)?;
    app.on_menu_event(|handle, event| handle_event(handle, event.id().as_ref()));
    #[cfg(target_os = "macos")]
    super::dock_menu::install(handle)?;
    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::AssetNotFound("default window icon".into()))?;
    TrayIconBuilder::with_id("pet-town-tray")
        .icon(icon)
        .tooltip("Pet Town")
        .menu(&tray_menu(handle, town)?)
        .build(app)?;
    Ok(())
}

/// Installation and native-process transitions refresh menus on AppKit's main thread.
pub(crate) fn refresh(app: &AppHandle) -> tauri::Result<()> {
    let target = app.clone();
    app.run_on_main_thread(move || {
        if let Err(error) = refresh_main(&target) {
            eprintln!("Could not refresh Pet Town menus: {error}");
        }
    })
}

fn refresh_main(app: &AppHandle) -> tauri::Result<()> {
    let town = crate::town_install::available(app) || crate::godot_bridge::running(app);
    app.set_menu(application_menu(app, town)?)?;
    if let Some(tray) = app.tray_by_id("pet-town-tray") {
        tray.set_menu(Some(tray_menu(app, town)?))?;
    }
    #[cfg(target_os = "macos")]
    super::dock_menu::refresh(town);
    Ok(())
}

pub(crate) fn handle_event(app: &AppHandle, id: &str) {
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

pub(crate) fn action(app: &AppHandle, id: &str) -> Result<(), String> {
    match id {
        "preferences" | "tray-settings" => crate::settings_window::open_internal(app, None, None),
        "open-3d-town" | "tray-open-3d-town" => crate::town_process::open(app),
        "close-3d-town" | "tray-close-3d-town" => crate::town_process::close(app),
        "show-town" | "tray-show-town" => crate::village_visibility::set(app, true).map(|_| ()),
        "hide-town" | "tray-hide-town" => crate::village_visibility::set(app, false).map(|_| ()),
        _ => Ok(()),
    }
}
