use super::agent::AgentSession;
use super::state::OrchestratorState;
use tauri::{AppHandle, Manager};

pub async fn run(
    app: AppHandle,
    agent: AgentSession,
    task_id: String,
    context: String,
) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<OrchestratorState>();
        let dispatch = state.1.lock().unwrap_or_else(|error| error.into_inner());
        let owned = {
            let runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
            runtime.active_task_id.as_deref() == Some(&task_id)
                && runtime.canceling_task_id.as_deref() != Some(&task_id)
        };
        if !owned {
            return Ok(None);
        }
        let pending = match agent.submit(&context) {
            Ok(pending) => pending,
            Err(error) => {
                state
                    .0
                    .lock()
                    .unwrap_or_else(|item| item.into_inner())
                    .closing_agent_pane_id = Some(agent.pane_id.clone());
                drop(dispatch);
                loop {
                    match agent.try_close() {
                        Ok(()) => break,
                        Err(value) if super::agent_response::terminal_missing(&value) => break,
                        Err(_) => std::thread::sleep(std::time::Duration::from_secs(1)),
                    }
                }
                let mut runtime = state.0.lock().unwrap_or_else(|item| item.into_inner());
                if runtime
                    .agent
                    .as_ref()
                    .is_some_and(|item| item.pane_id == agent.pane_id)
                {
                    runtime.agent = None;
                    runtime.lifecycle_generation = runtime.lifecycle_generation.wrapping_add(1);
                    runtime.launching = false;
                    runtime.launch_signature = None;
                }
                if runtime.closing_agent_pane_id.as_deref() == Some(&agent.pane_id) {
                    runtime.closing_agent_pane_id = None;
                }
                return Err(format!(
                    "{error} The uncertain Pi session was closed before retry."
                ));
            }
        };
        drop(dispatch);
        agent.collect(pending).map(Some)
    })
    .await
    .map_err(|_| "The Pi agent stopped unexpectedly.".to_string())?
}
