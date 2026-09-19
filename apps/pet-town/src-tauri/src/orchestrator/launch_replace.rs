use super::agent::AgentSession;
use super::state::OrchestratorState;
use std::time::Duration;

pub async fn close_new(app: &tauri::AppHandle, state: &OrchestratorState, agent: AgentSession) {
    state
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .cleanup_count += 1;
    let _ = tauri::async_runtime::spawn_blocking(move || loop {
        match agent.try_close() {
            Ok(()) => break,
            Err(error) if super::agent_response::terminal_missing(&error) => break,
            Err(_) => std::thread::sleep(Duration::from_secs(1)),
        }
    })
    .await;
    let should_exit = {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        runtime.cleanup_count = runtime.cleanup_count.saturating_sub(1);
        runtime.exiting && runtime.cleanup_count == 0 && runtime.agent.is_none()
    };
    if should_exit {
        app.exit(0);
    }
}

pub async fn close_stale(state: &OrchestratorState, generation: u64) -> Result<(), String> {
    let (stale, active) = {
        let runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime.lifecycle_generation != generation {
            return Err("The assistant changed while Pi was starting.".into());
        }
        (
            runtime.agent.clone(),
            runtime.active_task_id.is_some() || runtime.closing_agent_pane_id.is_some(),
        )
    };
    if active {
        return Err("Stop the active Pi task before changing its agent.".into());
    }
    let Some(agent) = stale else { return Ok(()) };
    let pane_id = agent.pane_id.clone();
    let closed = tauri::async_runtime::spawn_blocking(move || match agent.try_close() {
        Ok(()) => true,
        Err(error) => super::agent_response::terminal_missing(&error),
    })
    .await
    .unwrap_or(false);
    if !closed {
        return Err("Could not close the existing Pi agent.".into());
    }
    let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    if runtime.lifecycle_generation != generation {
        return Err("The assistant changed while Pi was starting.".into());
    }
    if runtime
        .agent
        .as_ref()
        .is_some_and(|item| item.pane_id == pane_id)
    {
        runtime.agent = None;
    }
    Ok(())
}
