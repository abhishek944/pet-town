mod archive;
pub(crate) mod commands;
mod download;
mod local;
mod network;
mod operations;
mod state;

pub(crate) use state::TownInstall;
use tauri::{AppHandle, Manager};

pub(crate) fn available(app: &AppHandle) -> bool {
    if local::development().is_some() {
        return true;
    }
    let state = app.state::<TownInstall>();
    let mut inner = state.lock();
    if inner.validated.is_none() {
        inner.validated = Some(local::resolve(app).is_ok());
    }
    inner.validated == Some(true)
}

pub(crate) fn launch_path(
    app: &AppHandle,
) -> Result<(std::path::PathBuf, Option<std::path::PathBuf>), String> {
    if let Some(development) = local::development() {
        return Ok(development);
    }
    let result = local::resolve(app).map(|path| (path, None));
    app.state::<TownInstall>().lock().validated = Some(result.is_ok());
    result
}

// Held only around process creation, never across the process lifetime.
pub(crate) fn launching(app: &AppHandle) -> Result<std::sync::MutexGuard<'_, ()>, String> {
    let state = app
        .try_state::<TownInstall>()
        .ok_or("Town state is unavailable.")?;
    // State::inner returns the application-owned reference, not the guard wrapper.
    let state: &TownInstall = state.inner();
    let guard = state
        .mutation
        .try_lock()
        .map_err(|_| "Wait for the Pet Town component operation.")?;
    Ok(guard)
}
