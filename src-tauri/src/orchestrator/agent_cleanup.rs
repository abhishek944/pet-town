use super::agent::AgentSession;
use super::state::OrchestratorState;

pub fn remove_dead(state: &OrchestratorState, dead: &AgentSession) {
    let closed = match dead.try_close() {
        Ok(()) => true,
        Err(error) => super::agent_response::terminal_missing(&error),
    };
    if !closed {
        return;
    }
    let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    if runtime
        .agent
        .as_ref()
        .is_some_and(|item| item.pane_id == dead.pane_id)
    {
        runtime.agent = None;
        runtime.active_task_id = None;
        runtime.canceling_task_id = None;
        runtime.closing_agent_pane_id = None;
        runtime.lifecycle_generation = runtime.lifecycle_generation.wrapping_add(1);
        runtime.launching = false;
        runtime.launch_signature = None;
    }
}
