use crate::settings_window::{close, SettingsSession};
use std::time::Duration;
use tauri::{AppHandle, Manager};

pub fn cleanup_failed_window(app: &AppHandle) -> bool {
    let mut cleaned = true;
    if let Some(window) = app.get_webview_window("settings") {
        cleaned = window.hide().is_ok();
        if window.close().is_err() {
            cleaned = false;
        }
    }
    close(app);
    cleaned
}

pub fn arm_readiness_timeout(app: &AppHandle, token: u64) {
    let app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(15));
        let main_app = app.clone();
        let _ = app.run_on_main_thread(move || {
            if main_app.state::<SettingsSession>().is_waiting(token) {
                cleanup_failed_window(&main_app);
            }
        });
    });
}
