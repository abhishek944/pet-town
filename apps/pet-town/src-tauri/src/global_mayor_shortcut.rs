use crate::{preferences::PreferencesStore, preferences_model::MayorMode};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Manager};

static HELD: AtomicBool = AtomicBool::new(false);

extern "C" fn changed(active: bool) {
    HELD.store(active, Ordering::SeqCst);
    eprintln!(
        "[mayor global shortcut] {}",
        if active { "pressed" } else { "released" }
    );
}

unsafe extern "C" {
    fn pv_global_mayor_shortcut_start(callback: extern "C" fn(bool));
}

pub fn start() {
    unsafe { pv_global_mayor_shortcut_start(changed) }
}

pub fn is_held(app: &AppHandle) -> bool {
    if !HELD.load(Ordering::SeqCst) {
        return false;
    }
    let settings = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    settings.enabled && settings.mode == MayorMode::Firstmate
}
