use super::TownTerminalState;
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Manager, WebviewWindow};

pub(super) fn check(app: &AppHandle, window: &WebviewWindow, epoch: u64) -> Result<(), String> {
    crate::town_commands::require_town(window)?;
    if app
        .state::<TownTerminalState>()
        .epoch
        .load(Ordering::SeqCst)
        != epoch
        || !app
            .state::<crate::town_process::TownWindowState>()
            .active
            .load(Ordering::SeqCst)
        || !window.is_focused().unwrap_or(false)
    {
        return Err("The town changed while connecting. Reconnect from its current window.".into());
    }
    Ok(())
}
