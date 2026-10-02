use tauri::Manager;

pub(crate) fn window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    crate::town_process::window_event(window, event);
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
