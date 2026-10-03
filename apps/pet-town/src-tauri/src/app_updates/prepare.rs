use super::state::{require_window, AppUpdates, Preparation};
use serde::Serialize;
use std::collections::HashSet;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Request {
    request_id: String,
}

pub(super) async fn run(app: AppHandle) -> Result<(), String> {
    let mut expected = HashSet::new();
    for label in ["settings", "town"] {
        if let Some(window) = app.get_webview_window(label) {
            require_window(&window)?;
            expected.insert(label.to_string());
        }
    }
    if crate::godot_bridge::running(&app) {
        expected.insert("godot".into());
    }
    let request = Request {
        request_id: uuid::Uuid::new_v4().to_string(),
    };
    {
        let state = app.state::<AppUpdates>();
        let mut inner = state.lock();
        if inner.snapshot.phase != "preparing" || inner.archive.is_none() || inner.update.is_none()
        {
            return Err("Download an update before installing it.".into());
        }
        inner.snapshot.phase = "preparing";
        inner.snapshot.error = None;
        inner.preparation = Some(Preparation {
            request_id: request.request_id.clone(),
            expected: expected.clone(),
            ready: HashSet::new(),
            error: None,
        });
    }
    app.state::<AppUpdates>().publish(&app);
    for label in expected {
        if label == "godot" {
            continue;
        }
        app.emit_to(&label, "app-update-prepare-install", &request)
            .map_err(|error| format!("Could not prepare {label}: {error}"))?;
    }
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppUpdates>();
        let deadline = Instant::now() + Duration::from_secs(20);
        let mut inner = state.lock();
        loop {
            let pending = inner
                .preparation
                .as_ref()
                .ok_or("Update preparation was cancelled.")?;
            if let Some(error) = &pending.error {
                return Err(error.clone());
            }
            if pending.ready == pending.expected {
                inner.preparation = None;
                return Ok(());
            }
            let remaining = deadline.saturating_duration_since(Instant::now());
            if remaining.is_zero() {
                return Err(
                    "A Pet Town window did not confirm its work was saved. Try again.".into(),
                );
            }
            let (next, _) = state
                .prepared
                .wait_timeout(inner, remaining)
                .unwrap_or_else(|error| error.into_inner());
            inner = next;
        }
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
pub(crate) fn respond_app_update_prepare(
    window: WebviewWindow,
    state: State<'_, AppUpdates>,
    request_id: String,
    ready: bool,
    error: Option<String>,
) -> Result<(), String> {
    require_window(&window)?;
    respond(&state, window.label(), request_id, ready, error)
}

pub(crate) fn respond_native(
    app: &AppHandle,
    request_id: String,
    ready: bool,
    error: Option<String>,
) -> Result<(), String> {
    respond(
        &app.state::<AppUpdates>(),
        "godot",
        request_id,
        ready,
        error,
    )
}

fn respond(
    state: &AppUpdates,
    label: &str,
    request_id: String,
    ready: bool,
    error: Option<String>,
) -> Result<(), String> {
    let mut inner = state.lock();
    let pending = inner
        .preparation
        .as_mut()
        .ok_or("No update installation is being prepared.")?;
    if pending.request_id != request_id
        || !pending.expected.contains(label)
        || pending.ready.contains(label)
        || pending.error.is_some()
    {
        return Err("This update preparation response is not valid.".into());
    }
    if ready {
        pending.ready.insert(label.to_string());
    } else {
        pending.error = Some(
            error
                .unwrap_or_else(|| "Save your work before updating.".into())
                .chars()
                .take(500)
                .collect(),
        );
    }
    state.prepared.notify_all();
    Ok(())
}
