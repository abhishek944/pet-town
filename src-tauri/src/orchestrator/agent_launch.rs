use super::agent::AgentSession;
use super::state::OrchestratorState;

pub fn decrement_cleanup(app: &tauri::AppHandle, state: &OrchestratorState) {
    let should_exit = {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        runtime.cleanup_count = runtime.cleanup_count.saturating_sub(1);
        runtime.exiting && runtime.cleanup_count == 0 && runtime.agent.is_none()
    };
    if should_exit {
        app.exit(0);
    }
}

pub fn take(state: &OrchestratorState, pane: &str) -> Option<AgentSession> {
    let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    if runtime
        .agent
        .as_ref()
        .is_some_and(|item| item.pane_id == pane)
    {
        runtime.agent.take()
    } else {
        None
    }
}

pub async fn start(
    workspace_id: String,
    herdr_workspace_id: String,
    preferences: crate::preferences_model::OrchestratorPreferences,
) -> Result<AgentSession, String> {
    let runtime_path = super::runtime::path_environment()?;
    tauri::async_runtime::spawn_blocking(move || {
        AgentSession::start(
            &workspace_id,
            &herdr_workspace_id,
            &preferences,
            runtime_path.as_deref(),
        )
    })
    .await
    .map_err(|_| "Could not start the Pi agent.".to_string())?
}
