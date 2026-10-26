use crate::{app_updates::AppUpdates, orchestrator, pet_studio, town_process};
use tauri::Manager;

pub(crate) fn run_event(app: &tauri::AppHandle, event: tauri::RunEvent) {
    match event {
        #[cfg(target_os = "macos")]
        tauri::RunEvent::MainEventsCleared => {
            if let Err(error) = crate::window_spaces::reconcile(app) {
                eprintln!("Could not reconcile Pet Street Spaces: {error}");
            }
        }
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
            app.state::<pet_town_agent_broker::RemoteMonitor>().stop();
            town_process::stop(app);
            app.state::<pet_studio::PetStudioState>().cleanup();
            if app.state::<AppUpdates>().restart_requested() {
                if let Err(error) = app
                    .state::<crate::app_singleton::AppLock>()
                    .release_for_restart()
                {
                    eprintln!("Could not release the Pet Town lock before update restart: {error}");
                    return;
                }
                app.restart();
            }
        }
        tauri::RunEvent::Reopen { .. } => {
            if app.get_webview_window("onboarding").is_some()
                || crate::onboarding::window::should_open(app)
            {
                let _ = crate::onboarding::window::open(app);
            } else {
                town_process::reopen(app);
            }
        }
        _ => {}
    }
}

pub(crate) fn window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    crate::town_process::window_event(window, event);
    if crate::street_windows::is_street_label(window.label())
        && matches!(event, tauri::WindowEvent::Destroyed)
    {
        crate::street_windows::forget_street_layout(window);
        crate::village_visibility::renderer_closed(window);
    }
    if window.label() == "settings"
        && matches!(
            event,
            tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed
        )
    {
        crate::settings_window::close(window.app_handle());
    }
    if window.label() == "orchestrator" && matches!(event, tauri::WindowEvent::Destroyed) {
        crate::orchestrator::task_cancel::stop_orchestrator_session(window.app_handle().clone());
    }
}
