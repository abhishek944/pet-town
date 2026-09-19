use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrchestratorStatus {
    pub available: bool,
    pub pet_ready: bool,
    pub live_connected: bool,
    pub herdr_connected: bool,
    pub pi_connected: bool,
    pub pi_model: Option<String>,
    pub pi_thinking: Option<String>,
    pub listening: bool,
    pub task_active: bool,
    pub active_task_id: Option<String>,
    pub wake_activated: bool,
    pub wake_generation: u64,
    pub workspace_id: Option<String>,
    pub message: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrchestratorPetState {
    pub active: bool,
    pub citizen_id: Option<String>,
    pub pet_id: Option<String>,
    pub display_name: String,
    pub listening: bool,
}
