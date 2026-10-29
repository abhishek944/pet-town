use super::{local, operations, state::Snapshot, TownInstall};
use tauri::{AppHandle, Manager, WebviewWindow};

fn require_settings(window: &WebviewWindow) -> Result<(), String> {
    let url = window.url().map_err(|e| e.to_string())?;
    let local = (url.scheme() == "tauri" && url.host_str() == Some("localhost"))
        || (url.scheme() == "http" && url.host_str() == Some("tauri.localhost"));
    let dev = cfg!(debug_assertions)
        && url.scheme() == "http"
        && matches!(url.host_str(), Some("localhost" | "127.0.0.1"))
        && url.port() == Some(1420);
    if window.label() != "settings" || url.path() != "/settings.html" || !(local || dev) {
        return Err("Manage the Pet Town download only in local Settings.".into());
    }
    Ok(())
}
fn refresh_local(app: &AppHandle) {
    let ready = super::available(app);
    let version = local::installed_version(app);
    let state = app.state::<TownInstall>();
    let mut inner = state.lock();
    inner.snapshot.installed_version = version;
    inner.snapshot.phase = if ready {
        "ready"
    } else if inner.snapshot.installed_version.is_some() {
        "incompatible"
    } else {
        "absent"
    };
}
#[tauri::command]
pub(crate) fn get_town_install_state(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<Snapshot, String> {
    require_settings(&window)?;
    let state = app.state::<TownInstall>();
    // The mutation guard prevents a late local read from replacing live progress.
    if let Ok(_guard) = state.mutation.try_lock() {
        let refresh = {
            let inner = state.lock();
            !inner.busy && inner.snapshot.phase != "error"
        };
        if refresh {
            refresh_local(&app);
        }
    }
    Ok(state.publish(&app))
}
#[tauri::command]
pub(crate) async fn install_town_component(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<Snapshot, String> {
    require_settings(&window)?;
    tauri::async_runtime::spawn_blocking(move || mutate(&app, false))
        .await
        .map_err(|e| e.to_string())?
}
#[tauri::command]
pub(crate) async fn remove_town_component(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<Snapshot, String> {
    require_settings(&window)?;
    tauri::async_runtime::spawn_blocking(move || mutate(&app, true))
        .await
        .map_err(|e| e.to_string())?
}
#[tauri::command]
pub(crate) fn cancel_town_install(app: AppHandle, window: WebviewWindow) -> Result<(), String> {
    require_settings(&window)?;
    let state = app.state::<TownInstall>();
    let mut inner = state.lock();
    if !inner.busy || inner.committed || inner.snapshot.phase == "installing" {
        return Err("There is no cancellable Pet Town download.".into());
    }
    inner.cancelled = true;
    if let Some(abort) = &inner.abort {
        abort.abort();
    }
    Ok(())
}
fn mutate(app: &AppHandle, remove: bool) -> Result<Snapshot, String> {
    local::target()?;
    let state = app.state::<TownInstall>();
    let _guard = state
        .mutation
        .try_lock()
        .map_err(|_| "A Pet Town component operation is already in progress.")?;
    let updates = app.state::<crate::app_updates::AppUpdates>();
    let _admission = updates.component_operation()?;
    if crate::godot_bridge::running(app) {
        return Err("Close Pet Town before changing its download.".into());
    }
    {
        let mut inner = state.lock();
        inner.busy = true;
        inner.cancelled = false;
        inner.committed = false;
        inner.snapshot.error = None;
        inner.snapshot.downloaded_bytes = 0;
        inner.snapshot.total_bytes = None;
        if remove {
            inner.snapshot.phase = "installing";
        }
    }
    let result = if remove {
        operations::remove(app)
    } else {
        operations::install(app)
    };
    state.lock().validated = None;
    refresh_local(app);
    {
        let mut inner = state.lock();
        inner.busy = false;
        if let Err(error) = &result {
            inner.snapshot.phase = "error";
            inner.snapshot.error = Some(error.clone());
        }
    }
    let snapshot = state.publish(app);
    let _ = crate::app_menu::refresh(app);
    result.map(|()| snapshot)
}
