use super::state::OrchestratorState;
use crate::preferences::PreferencesStore;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn set_orchestrator_listening(value: bool, app: AppHandle) {
    app.state::<OrchestratorState>().set_listening(value, &app);
}

#[tauri::command]
pub fn stop_orchestrator_session(app: AppHandle) {
    super::wake::stop(&app);
    let state = app.state::<OrchestratorState>();
    let _dispatch = state.1.lock().unwrap_or_else(|error| error.into_inner());
    let active_agent = {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        runtime.live_connected = false;
        runtime.connecting = false;
        runtime.listening = false;
        runtime.wake_activated = false;
        runtime.session_generation = runtime.session_generation.wrapping_add(1);
        runtime.canceling_task_id = None;
        runtime.active_task_id.as_ref().and(runtime.agent.clone())
    };
    if let Some(agent) = active_agent {
        cancel_or_close(&state, agent);
    }
    state.emit(&app);
    let configured = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    if configured.enabled
        && configured.wake_enabled
        && crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref())
    {
        let _ = super::wake::start(&app, &configured.display_name);
    }
}
fn cancel_or_close(state: &OrchestratorState, agent: super::agent::AgentSession) {
    let canceled = agent.cancel().is_ok();
    let closed = if canceled {
        false
    } else {
        match agent.try_close() {
            Ok(()) => true,
            Err(error) => super::agent_response::terminal_missing(&error),
        }
    };
    if !canceled && !closed {
        return;
    }
    let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    runtime.active_task_id = None;
    if closed
        && runtime
            .agent
            .as_ref()
            .is_some_and(|item| item.pane_id == agent.pane_id)
    {
        runtime.agent = None;
        runtime.lifecycle_generation = runtime.lifecycle_generation.wrapping_add(1);
        runtime.launching = false;
        runtime.launch_signature = None;
    }
}
#[tauri::command]
pub fn cancel_orchestrator_task(delegation_id: String, app: AppHandle) -> Result<(), String> {
    let state = app.state::<OrchestratorState>();
    let _dispatch = state.1.lock().unwrap_or_else(|error| error.into_inner());
    let (agent, task) = {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime.canceling_task_id.is_some() {
            return Err("Pi task cancellation is already in progress.".into());
        }
        if runtime.active_task_id.as_deref() != Some(&delegation_id) {
            return Err("That Pi task is no longer active.".into());
        }
        let task = runtime
            .active_task_id
            .clone()
            .ok_or_else(|| "No Pi task is active.".to_string())?;
        let agent = runtime
            .agent
            .clone()
            .ok_or_else(|| "Pi agent is not connected.".to_string())?;
        runtime.canceling_task_id = Some(task.clone());
        (agent, task)
    };
    let result = agent.cancel();
    let still_active = {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        let active = runtime.active_task_id.as_deref() == Some(&task);
        if runtime.canceling_task_id.as_deref() == Some(&task) {
            runtime.canceling_task_id = None;
        }
        if result.is_ok() && active {
            runtime.active_task_id = None;
        }
        active
    };
    state.emit(&app);
    if result.is_err() && !still_active {
        return Ok(());
    }
    result
}
