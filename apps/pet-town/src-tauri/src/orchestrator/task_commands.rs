use super::agent::AgentSession;
use super::state::OrchestratorState;
use tauri::{AppHandle, Manager};

fn take_agent(
    state: &OrchestratorState,
    delegation_id: &str,
) -> Result<Option<AgentSession>, String> {
    let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    if !runtime.live_connected {
        return Err("Voice session is not connected.".into());
    }
    if runtime.active_task_id.is_some() {
        return Err("Pi is already handling another request.".into());
    }
    if runtime.closing_agent_pane_id.is_some() {
        return Err("The Pi agent is still closing. Please wait before retrying.".into());
    }
    if runtime.launching {
        return Err("Pi is still preparing this workspace. Please try again shortly.".into());
    }
    let Some(agent) = runtime.agent.clone() else {
        return Ok(None);
    };
    runtime.active_task_id = Some(delegation_id.to_string());
    Ok(Some(agent))
}

/// Reopens the voice workspace and relaunches Pi when the saved agent is
/// gone (for example, the user closed the space in Herdr).
async fn recreate_agent(app: AppHandle, state: &OrchestratorState) -> Result<(), String> {
    let workspace_id = {
        let runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        runtime.selected_workspace_id.clone()
    };
    let Some(workspace_id) = workspace_id else {
        return Err("Pi is not running. Disconnect and reconnect voice to start it.".to_string());
    };
    super::launcher::ensure(app, workspace_id).await
}

fn is_canceling(state: &OrchestratorState, id: &str) -> bool {
    state
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .canceling_task_id
        .as_deref()
        == Some(id)
}
#[tauri::command]
pub async fn delegate_orchestrator_task(
    delegation_id: String,
    context: String,
    full: bool,
    app: AppHandle,
) -> Result<Option<String>, String> {
    if delegation_id.is_empty() || delegation_id.len() > 160 || context.len() > 8_000 {
        return Err("Delegated task context is invalid.".into());
    }
    let state = app.state::<OrchestratorState>();
    let agent = match take_agent(&state, &delegation_id)? {
        Some(agent) => agent,
        None => {
            recreate_agent(app.clone(), &state).await?;
            take_agent(&state, &delegation_id)?.ok_or_else(|| {
                "Pi could not be started. Disconnect and reconnect voice to start it again."
                    .to_string()
            })?
        }
    };
    state.emit(&app);
    let first = super::task_dispatch::run(
        app.clone(),
        agent.clone(),
        delegation_id.clone(),
        context.clone(),
    )
    .await;
    let result = match first {
        Err(error)
            if super::task_dispatch::dead_agent(&error)
                && !is_canceling(&state, &delegation_id) =>
        {
            recreate_agent(app.clone(), &state).await?;
            let agent = {
                let runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
                runtime.agent.clone().ok_or_else(|| {
                    "Pi could not be started. Disconnect and reconnect voice to start it again."
                        .to_string()
                })?
            };
            super::task_dispatch::run(app.clone(), agent, delegation_id.clone(), context).await
        }
        other => other,
    };
    let output = match result {
        Ok(Some(output)) => output,
        Ok(None) => return Ok(None),
        Err(error) => {
            if finish_error(&state, &delegation_id) {
                state.emit(&app);
                return Ok(None);
            }
            let probe = agent.clone();
            let alive = tauri::async_runtime::spawn_blocking(move || probe.alive()).await;
            if matches!(alive, Ok(Ok(false))) {
                super::agent_cleanup::remove_dead(&state, &agent);
            }
            state.emit(&app);
            return Err(error);
        }
    };
    let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    if runtime.active_task_id.as_deref() != Some(&delegation_id) {
        return Ok(None);
    }
    runtime.active_task_id = None;
    let canceled = runtime.canceling_task_id.as_deref() == Some(&delegation_id);
    if canceled {
        runtime.canceling_task_id = None;
    }
    drop(runtime);
    state.emit(&app);
    if canceled {
        return Ok(None);
    }
    Ok(Some(if full {
        output
    } else {
        super::commentary::bounded(&output)
    }))
}
fn finish_error(state: &OrchestratorState, id: &str) -> bool {
    let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    let active = runtime.active_task_id.as_deref() == Some(id);
    let canceling = runtime.canceling_task_id.as_deref() == Some(id);
    if active {
        runtime.active_task_id = None;
    }
    if canceling {
        runtime.canceling_task_id = None;
    }
    canceling || !active
}
