use tauri::Manager;

mod adapter_events;
mod adapter_setup;
mod agents;
mod app_menu;
mod app_singleton;
mod control;
mod focus;
mod focus_id;
mod herdr_command;
mod herdr_state;
#[cfg(target_os = "macos")]
mod macos_activation;
#[cfg(target_os = "macos")]
mod macos_app_focus;
mod orchestrator;
mod pet_studio;
mod preferences;
mod preferences_commands;
mod preferences_defaults;
mod preferences_io;
mod preferences_lock;
mod preferences_model;
mod preferences_permissions;
mod preferences_registration;
mod preferences_state;
mod preferences_validation;
mod sessions;
mod settings_window;
mod settings_window_lifecycle;
mod town_bridge;
mod town_process;
mod village_visibility;
mod window;

pub use adapter_events::{record_from_stdin, relay_from_stdin};
pub use adapter_setup::{configure_adapter, setups_json};
pub use agents::{AgentSnapshot, AgentView};
pub use preferences_commands::startup_enabled_from_disk;
pub use sessions::snapshot_json;

#[tauri::command]
fn quit_pet_town(app: tauri::AppHandle) {
    app.exit(0);
}

pub fn run_town_bridge() {
    town_bridge::run();
}

pub fn focus_agent_from_cli(id: &str) -> Result<(), String> {
    focus::focus_current_agent(id)
}

pub fn verify_existing_herdr_agent(pane_id: String) -> Result<(), String> {
    focus::verify_existing_herdr_agent(pane_id)
}

pub fn verify_existing_application(bundle_id: String) -> Result<(), String> {
    macos_app_focus::activate_running_application(&bundle_id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    control::install_signal_handlers();
    let app_lock = match app_singleton::acquire_or_notify() {
        Ok(Some(lock)) => lock,
        Ok(None) => return,
        Err(error) => {
            eprintln!("pet-town: could not acquire application lock: {error}");
            return;
        }
    };
    let builder = tauri::Builder::default().plugin(tauri_plugin_dialog::init());
    #[cfg(target_os = "macos")]
    let builder = builder.plugin(tauri_nspanel::init());
    builder
        .manage(app_lock)
        .manage(window::HitRegions::default())
        .manage(village_visibility::VillageVisibility::default())
        .manage(preferences::PreferencesStore::load_default())
        .manage(pet_studio::PetStudioState::load())
        .manage(orchestrator::OrchestratorState::default())
        .manage(settings_window::SettingsSession::default())
        .manage(town_process::TownProcess::default())
        .on_window_event(|window, event| {
            if window.label() == "settings"
                && matches!(
                    event,
                    tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed
                )
            {
                settings_window::close(window.app_handle());
            }
            if window.label() == "orchestrator" && matches!(event, tauri::WindowEvent::Destroyed) {
                orchestrator::task_cancel::stop_orchestrator_session(window.app_handle().clone());
            }
        })
        .setup(|app| {
            app_menu::install(app)?;
            window::create_village_window(app)?;
            window::configure_window(app)?;
            control::start(app.handle().clone());
            orchestrator::commands::preferences_changed(app.handle());
            #[cfg(target_os = "macos")]
            window::start_hit_test_loop(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            adapter_setup::list_adapter_setups,
            adapter_setup::set_adapter_enabled,
            sessions::list_agents,
            focus::focus_agent,
            pet_studio::draft_commands::create_pet_draft,
            pet_studio::draft_commands::discard_pet_draft,
            pet_studio::draft_commands::import_pet_animation,
            pet_studio::pack_commands::activate_pet_extension,
            pet_studio::pack_commands::discard_pet_extension_candidate,
            pet_studio::pack_commands::list_pet_extensions,
            pet_studio::pack_commands::list_user_pet_packs,
            pet_studio::pack_commands::save_pet_extension,
            pet_studio::pack_commands::save_pet_pack,
            orchestrator::task_cancel::cancel_orchestrator_task,
            orchestrator::task_commands::delegate_orchestrator_task,
            orchestrator::status_commands::get_orchestrator_status,
            orchestrator::status_commands::get_orchestrator_pet_state,
            orchestrator::status_commands::focus_mayor,
            orchestrator::status_commands::report_orchestrator_diagnostic,
            orchestrator::status_commands::report_orchestrator_error,
            orchestrator::status_commands::list_orchestrator_workspaces,
            orchestrator::task_cancel::set_orchestrator_listening,
            orchestrator::commands::start_orchestrator_session,
            orchestrator::commands::rearm_orchestrator_voice,
            orchestrator::task_cancel::stop_orchestrator_session,
            preferences_commands::apply_preferences,
            preferences_commands::get_preferences,
            preferences_commands::reload_preferences,
            settings_window::get_settings_context,
            settings_window::is_settings_open,
            settings_window::open_preferences,
            settings_window::show_settings,
            town_process::open_3d_town,
            quit_pet_town,
            window::set_hit_regions,
            village_visibility::renderer_ready,
            village_visibility::set_village_visible,
            village_visibility::village_visible
        ])
        .build(tauri::generate_context!())
        .expect("failed to build pet-town")
        .run(|app, event| match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                let state = app.state::<orchestrator::OrchestratorState>();
                state.mark_exiting();
                orchestrator::prepare_exit(app);
                if !state.shutdown() {
                    api.prevent_exit();
                    orchestrator::retry_exit(app.clone());
                }
            }
            tauri::RunEvent::Exit => {
                town_process::stop(app);
                app.state::<pet_studio::PetStudioState>().cleanup();
            }
            tauri::RunEvent::Reopen { .. } => {
                let _ = settings_window::open_internal(app, None, Some("app".into()));
            }
            _ => {}
        });
}
