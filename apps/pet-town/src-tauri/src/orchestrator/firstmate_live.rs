//! GPT-Live work delegation through the Mayor's persistent Firstmate primary.
use super::{firstmate, state::OrchestratorState};
use crate::{preferences::PreferencesStore, preferences_model::MayorMode};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};

fn live(app: &AppHandle) -> Result<(), String> {
    let settings = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    if !settings.enabled || settings.mode != MayorMode::Live {
        return Err("Start Mayor in Live mode first.".into());
    }
    if settings.firstmate_path.is_none()
        || settings.firstmate_path != settings.trusted_firstmate_path
    {
        return Err("Choose and trust the Firstmate folder in Mayor settings first.".into());
    }
    Ok(())
}

fn active(app: &AppHandle, id: &str) -> bool {
    let runtime = app.state::<OrchestratorState>();
    let current = runtime.0.lock().unwrap_or_else(|error| error.into_inner());
    current.live_connected && current.active_task_id.as_deref() == Some(id)
}

#[tauri::command]
pub async fn delegate_firstmate_task(
    delegation_id: String,
    context: String,
    app: AppHandle,
) -> Result<Option<firstmate::FirstmateReply>, String> {
    live(&app)?;
    if delegation_id.is_empty()
        || delegation_id.len() > 160
        || context.trim().is_empty()
        || context.len() > 8_000
    {
        return Err("Delegated task context is invalid.".into());
    }
    let state = app.state::<OrchestratorState>();
    {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if !runtime.live_connected {
            return Err("Voice session is not connected.".into());
        }
        if runtime.active_task_id.is_some() {
            return Err("Firstmate is already handling another request.".into());
        }
        runtime.active_task_id = Some(delegation_id.clone());
    }
    state.emit(&app);
    let result = run(&app, &delegation_id, context).await;
    {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime.active_task_id.as_deref() == Some(&delegation_id) {
            runtime.active_task_id = None;
        }
    }
    state.emit(&app);
    result
}

async fn run(
    app: &AppHandle,
    id: &str,
    context: String,
) -> Result<Option<firstmate::FirstmateReply>, String> {
    firstmate::start_firstmate(app.clone()).await?;
    if !active(app, id) {
        return Ok(None);
    }
    if firstmate::poll_firstmate_replies(app.clone())?.is_some() {
        return Err("Firstmate has an earlier reply waiting. Open Standard mode to hear it before sending another request.".into());
    }
    if !active(app, id) {
        return Ok(None);
    }
    firstmate::send_firstmate_text(context, app.clone()).await?;
    let started = Instant::now();
    loop {
        if !active(app, id) {
            return Ok(None);
        }
        if let Some(reply) = firstmate::poll_firstmate_replies(app.clone())? {
            return Ok(Some(reply));
        }
        if started.elapsed() > Duration::from_secs(5) {
            let status = firstmate::firstmate_agent_status(app.clone()).await?;
            if matches!(status.as_str(), "done" | "blocked" | "idle") {
                return Err("Firstmate stopped without a completed reply. Check its Herdr pane before retrying.".into());
            }
        }
        if started.elapsed() > Duration::from_secs(600) {
            return Err(
                "Firstmate is still working. Open its Herdr pane to follow the task.".into(),
            );
        }
        tauri::async_runtime::spawn_blocking(|| std::thread::sleep(Duration::from_secs(1)))
            .await
            .map_err(|_| "Firstmate reply wait stopped unexpectedly.".to_string())?;
    }
}

#[tauri::command]
pub async fn cancel_firstmate_task(delegation_id: String, app: AppHandle) -> Result<(), String> {
    live(&app)?;
    if !active(&app, &delegation_id) {
        return Err("That Firstmate task is no longer active.".into());
    }
    let target = app.clone();
    tauri::async_runtime::spawn_blocking(move || firstmate::interrupt(&target))
        .await
        .map_err(|_| "Could not interrupt Firstmate.".to_string())??;
    app.state::<OrchestratorState>()
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .active_task_id = None;
    app.state::<OrchestratorState>().emit(&app);
    Ok(())
}
