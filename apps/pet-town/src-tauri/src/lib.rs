use tauri::Manager;
mod adapter_events;
mod adapter_setup;
mod agents;
mod app_events;
mod app_menu;
mod app_singleton;
mod control;
mod focus;
mod focus_id;
mod focus_route;
mod focus_trace;
#[cfg(target_os = "macos")]
mod global_mayor_shortcut;
mod herdr_command;
mod herdr_state;
#[cfg(target_os = "macos")]
mod macos_activation;
#[cfg(target_os = "macos")]
mod macos_app_focus;
#[cfg(unix)]
mod mayor_retry_signal;
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
mod town_commands;
mod town_process;
mod town_snapshot;
mod town_terminal;
mod town_voice;
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
        .manage(orchestrator::firstmate::FirstmateState::default())
        .manage(orchestrator::firstmate_audio::FirstmateAudioState::default())
        .manage(settings_window::SettingsSession::default())
        .manage(town_process::TownWindowState::default())
        .manage(town_terminal::TownTerminalState::default())
        .on_window_event(app_events::window_event)
        .setup(|app| {
            app_menu::install(app)?;
            window::create_village_window(app)?;
            window::configure_window(app)?;
            control::start(app.handle().clone());
            #[cfg(target_os = "macos")]
            global_mayor_shortcut::start();
            orchestrator::commands::preferences_changed(app.handle(), None);
            #[cfg(target_os = "macos")]
            window::start_hit_test_loop(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            adapter_setup::list_adapter_setups,
            adapter_setup::set_adapter_enabled,
            sessions::list_agents,
            focus::focus_agent,
            focus_trace::trace_pet_input,
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
            orchestrator::firstmate_live::delegate_firstmate_task,
            orchestrator::firstmate_live::cancel_firstmate_task,
            orchestrator::status_commands::get_orchestrator_status,
            orchestrator::credentials::openai_key_source,
            orchestrator::credentials::save_openai_key,
            orchestrator::credentials::import_openai_key_from_shell,
            orchestrator::status_commands::get_orchestrator_pet_state,
            orchestrator::status_commands::focus_mayor,
            orchestrator::status_commands::set_mayor_speech,
            orchestrator::status_commands::set_mayor_voice_status,
            orchestrator::status_commands::report_orchestrator_diagnostic,
            orchestrator::status_commands::report_orchestrator_error,
            orchestrator::status_commands::list_orchestrator_workspaces,
            orchestrator::task_cancel::set_orchestrator_listening,
            orchestrator::firstmate::set_firstmate_talk,
            orchestrator::firstmate::firstmate_talk_active,
            orchestrator::firstmate::begin_firstmate_listening,
            orchestrator::firstmate::firstmate_phase,
            orchestrator::firstmate::set_firstmate_phase,
            orchestrator::firstmate::firstmate_voice_ready,
            orchestrator::firstmate::start_firstmate,
            orchestrator::firstmate::firstmate_agent_status,
            orchestrator::firstmate::send_firstmate_text,
            orchestrator::firstmate::poll_firstmate_replies,
            orchestrator::firstmate::acknowledge_firstmate_reply,
            orchestrator::firstmate::latest_firstmate_reply,
            orchestrator::firstmate::transcribe_firstmate_audio,
            orchestrator::firstmate::speak_firstmate_text,
            orchestrator::firstmate_audio::play_firstmate_audio,
            orchestrator::firstmate_audio::stop_firstmate_audio,
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
            town_snapshot::get_town_snapshot,
            town_commands::town_action,
            town_terminal::town_terminal_open,
            town_terminal::town_terminal_send,
            town_terminal::town_terminal_close,
            town_commands::quit_pet_town,
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
                town_process::reopen(app);
            }
            _ => {}
        });
}
