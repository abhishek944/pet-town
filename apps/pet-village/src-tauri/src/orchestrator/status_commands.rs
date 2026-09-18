use super::herdr::WorkspaceTarget;
use super::state::OrchestratorState;
use super::status_types::{OrchestratorPetState, OrchestratorStatus};
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

#[tauri::command]
pub async fn get_orchestrator_status(app: AppHandle) -> OrchestratorStatus {
    let state = app.state::<OrchestratorState>();
    let (agent, generation) = {
        let runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        (runtime.agent.clone(), runtime.lifecycle_generation)
    };
    let observed_pane = agent.as_ref().map(|agent| agent.pane_id.clone());
    let herdr = tauri::async_runtime::spawn_blocking(super::herdr::workspaces)
        .await
        .is_ok_and(|result| result.is_ok());
    let observed_pi = match agent {
        Some(agent) => tauri::async_runtime::spawn_blocking(move || agent.alive())
            .await
            .is_ok_and(|result| result.unwrap_or(false)),
        None => false,
    };
    state.observed_status(
        &app,
        herdr,
        generation,
        observed_pane.as_deref(),
        observed_pi,
    )
}

#[tauri::command]
pub fn get_orchestrator_pet_state(app: AppHandle) -> OrchestratorPetState {
    app.state::<OrchestratorState>().pet_state(&app)
}

#[tauri::command]
pub fn report_orchestrator_diagnostic(message: String) {
    eprintln!("[assistant trace] {message}");
}

#[tauri::command]
pub fn report_orchestrator_error(message: String, app: AppHandle) {
    eprintln!("[assistant] {message}");
    let state = app.state::<OrchestratorState>();
    state
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .wake_status = Some(format!("Voice start failed: {message}"));
    state.emit(&app);
}

#[tauri::command]
pub async fn list_orchestrator_workspaces(app: AppHandle) -> Result<Vec<WorkspaceTarget>, String> {
    let result = workspaces(&app).await;
    app.state::<OrchestratorState>().emit(&app);
    result
}
