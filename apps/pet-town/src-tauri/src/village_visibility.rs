use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter, Manager};

pub(crate) struct VillageVisibility {
    requested: AtomicBool,
    ready: AtomicBool,
    town_active: AtomicBool,
}

impl Default for VillageVisibility {
    fn default() -> Self {
        Self {
            requested: AtomicBool::new(true),
            ready: AtomicBool::new(false),
            town_active: AtomicBool::new(false),
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct VillageVisibilityChanged {
    visible: bool,
}

fn apply(app: &AppHandle, visible: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main village window is unavailable".to_string())?;
    if visible {
        crate::window::show_window(&window)
    } else {
        window.hide().map_err(|error| error.to_string())
    }
}

pub(crate) fn set(app: &AppHandle, visible: bool) -> Result<bool, String> {
    let state = app.state::<VillageVisibility>();
    state.requested.store(visible, Ordering::SeqCst);
    if state.ready.load(Ordering::SeqCst) {
        apply(app, visible && !state.town_active.load(Ordering::SeqCst))?;
    }
    let _ = app.emit(
        "village-visibility-changed",
        VillageVisibilityChanged { visible },
    );
    Ok(visible)
}

pub(crate) fn set_town_active(app: &AppHandle, active: bool) -> Result<(), String> {
    let state = app.state::<VillageVisibility>();
    state.town_active.store(active, Ordering::SeqCst);
    if state.ready.load(Ordering::SeqCst) {
        let visible = state.requested.load(Ordering::SeqCst) && !active;
        apply(app, visible)?;
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn renderer_ready(app: AppHandle) -> Result<bool, String> {
    let state = app.state::<VillageVisibility>();
    state.ready.store(true, Ordering::SeqCst);
    let visible =
        state.requested.load(Ordering::SeqCst) && !state.town_active.load(Ordering::SeqCst);
    apply(&app, visible)?;
    Ok(visible)
}

#[tauri::command]
pub(crate) fn set_village_visible(app: AppHandle, visible: bool) -> Result<bool, String> {
    set(&app, visible)
}

#[tauri::command]
pub(crate) fn village_visible(state: tauri::State<'_, VillageVisibility>) -> bool {
    state.requested.load(Ordering::SeqCst)
}
