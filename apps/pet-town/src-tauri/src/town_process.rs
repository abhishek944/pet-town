use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use tauri::{webview::PageLoadEvent, AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub(crate) const TOWN_LABEL: &str = "town";

#[derive(Default)]
pub(crate) struct TownWindowState {
    opening: Mutex<()>,
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
    let state = app.state::<TownWindowState>();
    let _opening = state
        .opening
        .try_lock()
        .map_err(|_| "The town window is already opening.")?;
    let window = if let Some(window) = app.get_webview_window(TOWN_LABEL) {
        window
    } else {
        #[cfg(debug_assertions)]
        let url = WebviewUrl::External("http://127.0.0.1:1422/".parse().unwrap());
        #[cfg(not(debug_assertions))]
        let url = WebviewUrl::App("town/index.html".into());
        WebviewWindowBuilder::new(app, TOWN_LABEL, url)
            .title("Pet Town")
            .inner_size(1280.0, 820.0)
            .min_inner_size(800.0, 560.0)
            .resizable(true)
            .fullscreen(true)
            .decorations(true)
            .transparent(false)
            .focusable(true)
            .focused(true)
            .visible(true)
            .center()
            .on_navigation(allowed_url)
            .on_page_load(|window, payload| {
                if matches!(payload.event(), PageLoadEvent::Started) {
                    crate::town_voice::release_talk(window.app_handle());
                    crate::town_terminal::release(window.app_handle());
                }
            })
            .build()
            .map_err(|error| format!("The 3D town could not open: {error}"))?
    };
    window
        .unminimize()
        .and_then(|_| window.show())
        .and_then(|_| window.set_fullscreen(true))
        .and_then(|_| window.set_focus())
        .map_err(|error| error.to_string())?;
    set_active(app, window.is_focused().unwrap_or(false));
    Ok(())
}

#[tauri::command]
pub(crate) async fn open_3d_town(app: AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || open(&app))
        .await
        .map_err(|_| "The 3D town window could not be opened.".to_string())?
}

fn set_active(app: &AppHandle, active: bool) {
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
    if app.state::<TownWindowState>().active.load(Ordering::SeqCst)
        && app.get_webview_window(TOWN_LABEL).is_none()
    {
        set_active(app, false);
    }
}

pub(crate) fn stop(app: &AppHandle) {
    set_active(app, false);
    if let Some(window) = app.get_webview_window(TOWN_LABEL) {
        let _ = window.destroy();
    }
}

pub(crate) fn reopen(app: &AppHandle) {
    if app.get_webview_window(TOWN_LABEL).is_some() {
        let _ = open(app);
    } else {
        let _ = crate::settings_window::open_internal(app, None, Some("app".into()));
    }
}
