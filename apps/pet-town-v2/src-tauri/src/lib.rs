use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;

mod agents;
mod focus_debug;
mod focus_targets;
mod storage;
mod studio;
mod window;

fn install_tray(app: &tauri::App) -> tauri::Result<()> {
    let settings = MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?;
    let playroom = MenuItem::with_id(app, "playroom", "Open Playroom", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Pet Town v2", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&settings, &playroom, &quit])?;
    let mut tray = TrayIconBuilder::new().menu(&menu).tooltip("Pet Town v2");
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.on_menu_event(|app, event| match event.id.as_ref() {
        "settings" => {
            let _ = window::show_settings(app);
        }
        "playroom" => {
            let _ = window::show_playroom(app);
        }
        "quit" => app.exit(0),
        _ => {}
    })
    .build(app)?;
    Ok(())
}

pub fn snapshot_json() -> String {
    serde_json::to_string(&agents::snapshot().unwrap_or_default()).unwrap_or_else(|_| "[]".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(window::HitRegions::default())
        .manage(focus_targets::FocusTargets::default())
        .setup(|app| {
            window::create_village_window(app)?;
            window::configure_window(app)?;
            install_tray(app)?;
            #[cfg(target_os = "macos")]
            window::start_hit_test_loop(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            agents::list_agents,
            agents::focus_agent,
            storage::get_preferences,
            storage::apply_preferences,
            storage::reset_v2_data,
            studio::save_capability_mapping,
            studio::list_capability_mappings,
            window::set_hit_regions,
            window::show_village,
            window::open_settings,
            window::open_playroom
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Pet Town v2");
}
