use super::herdr::WorkspaceTarget;
use super::state::{OrchestratorPetState, OrchestratorState, OrchestratorStatus};
use tauri::{AppHandle, Manager};

async fn workspaces(app: &AppHandle) -> Result<Vec<WorkspaceTarget>, String> {
    let result = tauri::async_runtime::spawn_blocking(super::herdr::workspaces)
        .await
        .map_err(|_| "Could not inspect Herdr workspaces.".to_string())?;
    app.state::<OrchestratorState>()
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .herdr_connected = result.is_ok();
    result
}

async fn recover_dead_agent(app: &AppHandle) {
    let state = app.state::<OrchestratorState>();
    let enabled = app
        .state::<crate::preferences::PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator
        .enabled;
    let agent = state
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .agent
        .clone();
    let Some(agent) = agent else {
        if enabled {
            schedule_recovery(app);
        }
        return;
    };
    let probe = agent.clone();
    let observation = tauri::async_runtime::spawn_blocking(move || probe.alive()).await;
    if !matches!(observation, Ok(Ok(false))) {
        return;
    }
    let cleanup = agent.clone();
    let closed = tauri::async_runtime::spawn_blocking(move || match cleanup.try_close() {
        Ok(()) => true,
        Err(error) => super::agent_response::terminal_missing(&error),
    })
    .await
    .unwrap_or(false);
    if !closed {
        return;
    }
    let removed = {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime
            .agent
            .as_ref()
            .is_some_and(|item| item.pane_id == agent.pane_id)
        {
            runtime.active_task_id = None;
            runtime.canceling_task_id = None;
            runtime.closing_agent_pane_id = None;
            runtime.agent.take()
        } else {
            None
        }
    };
    if removed.is_some() {
        state.emit(app);
    }
    if enabled {
        schedule_recovery(app);
    }
}

fn schedule_recovery(app: &AppHandle) {
    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let _ = super::launcher::ensure_default(handle).await;
    });
}

#[tauri::command]
pub async fn get_orchestrator_status(app: AppHandle) -> OrchestratorStatus {
    let _ = workspaces(&app).await;
    recover_dead_agent(&app).await;
    app.state::<OrchestratorState>().status()
}

#[tauri::command]
pub fn get_orchestrator_pet_state(app: AppHandle) -> OrchestratorPetState {
    app.state::<OrchestratorState>().pet_state(&app)
}

#[tauri::command]
pub async fn list_orchestrator_workspaces(app: AppHandle) -> Result<Vec<WorkspaceTarget>, String> {
    let result = workspaces(&app).await;
    app.state::<OrchestratorState>().emit(&app);
    result
}
