use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use tauri::{AppHandle, Manager};

pub(crate) const TOWN_LABEL: &str = "town";

#[derive(Default)]
pub(crate) struct TownWindowState {
    pub(crate) active: AtomicBool,
    pub(crate) talking: Mutex<crate::town_voice::TownTalkState>,
    pub(crate) roster: Mutex<crate::town_snapshot::TownRosterCache>,
}

pub(crate) fn allowed_url(url: &tauri::Url) -> bool {
    if cfg!(debug_assertions) {
        url.scheme() == "http"
            && url.host_str() == Some("127.0.0.1")
            && url.port() == Some(1422)
            && url.path() == "/"
    } else {
        let local = (url.scheme() == "tauri" && url.host_str() == Some("localhost"))
            || (url.scheme() == "http" && url.host_str() == Some("tauri.localhost"));
        local && url.path() == "/town/index.html"
    }
}

pub(crate) fn open(app: &AppHandle) -> Result<(), String> {
    crate::godot_bridge::open(app)
}

#[tauri::command]
pub(crate) async fn open_3d_town(app: AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || open(&app))
        .await
        .map_err(|_| "Pet Town window could not be opened.".to_string())?
}

pub(crate) fn set_active(app: &AppHandle, active: bool) {
    let state = app.state::<TownWindowState>();
    let changed = state.active.swap(active, Ordering::SeqCst) != active;
    if !active {
        crate::town_voice::release_talk(app);
        crate::town_terminal::release(app);
    }
    if changed {
        let _ = crate::village_visibility::set_town_active(app, active);
    }
}

pub(crate) fn window_event(window: &tauri::Window, event: &tauri::WindowEvent) {
    if window.label() != TOWN_LABEL {
        return;
    }
    match event {
        tauri::WindowEvent::Focused(active) => set_active(window.app_handle(), *active),
        tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed => {
            set_active(window.app_handle(), false)
        }
        _ => {}
    }
}

// Retain the control-loop hook as a fallback if a platform misses the close event.
pub(crate) fn reap(app: &AppHandle) {
    crate::godot_bridge::reap(app);
    if !crate::godot_bridge::running(app)
        && app.state::<TownWindowState>().active.load(Ordering::SeqCst)
        && app.get_webview_window(TOWN_LABEL).is_none()
    {
        set_active(app, false);
    }
}

// User close is graceful so Godot can save boat state and release workers.
// The existing force-stop remains reserved for desktop shutdown.
pub(crate) fn close(app: &AppHandle) -> Result<(), String> {
    if !crate::godot_bridge::request_close(app)? {
        if let Some(window) = app.get_webview_window(TOWN_LABEL) {
            window.close().map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

pub(crate) fn stop(app: &AppHandle) {
    crate::godot_bridge::stop(app);
    set_active(app, false);
    if let Some(window) = app.get_webview_window(TOWN_LABEL) {
        let _ = window.destroy();
    }
}

pub(crate) fn reopen(app: &AppHandle) {
    if crate::godot_bridge::running(app) || app.get_webview_window(TOWN_LABEL).is_some() {
        let _ = open(app);
    } else {
        let _ = crate::settings_window::open_internal(app, None, Some("app".into()));
    }
}
