use tauri::Manager;

mod adapter_events;
mod adapter_setup;
mod adapters;
mod agents;
mod app_launch;
mod app_menu;
mod app_singleton;
mod broker;
mod control;
mod focus;
mod focus_id;
mod herdr_command;
mod herdr_state;
mod labels;
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
mod sessions;
mod settings_window;
mod settings_window_lifecycle;
mod village_visibility;
mod window;

pub use adapter_events::{record_from_stdin, relay_from_stdin};
pub use adapter_setup::{configure_adapter, setups_json};
pub use agents::{AgentSnapshot, AgentView};
pub use preferences_commands::startup_enabled_from_disk;
pub use sessions::snapshot_json;

pub fn focus_agent_from_cli(id: &str) -> Result<(), String> {
    focus::focus_current_agent(id)
}

pub fn focus_route_from_cli(route: &str) -> Result<(), String> {
    focus::focus_serialized_route(route)
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
    tauri::Builder::default()
        .manage(app_lock)
        .manage(window::HitRegions::default())
        .manage(village_visibility::VillageVisibility::default())
        .manage(focus::FocusTargets::default())
        .manage(preferences::PreferencesStore::load_default())
        .manage(pet_studio::PetStudioState::load())
        .manage(orchestrator::OrchestratorState::default())
        .manage(settings_window::SettingsSession::default())
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
                orchestrator::task_commands::stop_orchestrator_session(window.app_handle().clone());
            }
        })
        .setup(|app| {
            app_menu::install(app)?;
            window::create_village_window(app)?;
            window::configure_window(app)?;
            control::start(app.handle().clone());
            orchestrator::commands::preferences_changed(app.handle());
            if app_launch::launched_from_app_bundle() {
                let first_run = app
                    .state::<preferences::PreferencesStore>()
                    .consume_first_run();
                let initial_tab = first_run.then_some("app".to_owned());
                let _ = settings_window::open_internal(app.handle(), None, initial_tab);
            }
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
            pet_studio::draft_commands::pet_studio_status,
            pet_studio::draft_commands::set_pet_reference,
            pet_studio::draft_commands::import_pet_animation,
            pet_studio::candidate_commands::approve_pet_animation,
            pet_studio::candidate_commands::discard_pet_animation_candidate,
            pet_studio::candidate_commands::get_pet_animation_candidate,
            pet_studio::generation_commands::assemble_pet_animation,
            pet_studio::generation_commands::generate_pet_animation,
            pet_studio::generation_commands::generate_pet_reference,
            pet_studio::pack_commands::activate_pet_extension,
            pet_studio::pack_commands::discard_pet_extension_candidate,
            pet_studio::pack_commands::list_pet_extensions,
            pet_studio::pack_commands::list_user_pet_packs,
            pet_studio::pack_commands::save_pet_extension,
            pet_studio::pack_commands::save_pet_pack,
            orchestrator::task_commands::cancel_orchestrator_task,
            orchestrator::task_commands::delegate_orchestrator_task,
            orchestrator::status_commands::get_orchestrator_status,
            orchestrator::status_commands::get_orchestrator_pet_state,
            orchestrator::status_commands::report_orchestrator_diagnostic,
            orchestrator::status_commands::report_orchestrator_error,
            orchestrator::status_commands::list_orchestrator_workspaces,
            orchestrator::task_commands::set_orchestrator_listening,
            orchestrator::commands::start_orchestrator_session,
            orchestrator::task_commands::stop_orchestrator_session,
            preferences_commands::apply_preferences,
            preferences_commands::get_preferences,
            preferences_commands::reload_preferences,
            settings_window::get_settings_context,
            settings_window::is_settings_open,
            settings_window::open_preferences,
            settings_window::show_settings,
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
            tauri::RunEvent::Exit => app.state::<pet_studio::PetStudioState>().cleanup(),
            tauri::RunEvent::Reopen { .. } => {
                let _ = settings_window::open_internal(app, None, None);
            }
            _ => {}
        });
}
