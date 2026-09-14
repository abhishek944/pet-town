use super::agent::AgentSession;
use crate::preferences::PreferencesStore;
use serde::Serialize;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Default)]
pub struct Runtime {
    pub agent: Option<AgentSession>,
    pub herdr_connected: bool,
    pub live_connected: bool,
    pub listening: bool,
    pub wake_activated: bool,
    pub active_task_id: Option<String>,
    pub canceling_task_id: Option<String>,
    pub closing_agent_pane_id: Option<String>,
    pub cleanup_count: usize,
    pub exiting: bool,
    pub exit_cleanup_running: bool,
    pub session_generation: u64,
    pub lifecycle_generation: u64,
    pub launching: bool,
    pub launch_signature: Option<String>,
    pub selected_workspace_id: Option<String>,
}

#[derive(Default)]
pub struct OrchestratorState(pub Mutex<Runtime>, pub Mutex<()>);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrchestratorStatus {
    pub available: bool,
    pub live_connected: bool,
    pub herdr_connected: bool,
    pub pi_connected: bool,
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

impl OrchestratorState {
    pub fn status(&self) -> OrchestratorStatus {
        let (
            pi_connected,
            herdr_connected,
            live_connected,
            listening,
            active_task_id,
            wake_activated,
            workspace_id,
        ) = {
            let runtime = self.0.lock().unwrap_or_else(|error| error.into_inner());
            (
                runtime.agent.is_some() && !runtime.launching,
                runtime.herdr_connected,
                runtime.live_connected,
                runtime.listening,
                runtime.active_task_id.clone(),
                runtime.wake_activated,
                runtime.selected_workspace_id.clone(),
            )
        };
        let available = super::openai::api_key().is_some();
        let message = if !available {
            "OpenAI key not found"
        } else if live_connected && pi_connected {
            "Ready in Herdr"
        } else if pi_connected {
            "Pi ready"
        } else if herdr_connected {
            "Ready to connect"
        } else {
            "Herdr unavailable"
        };
        OrchestratorStatus {
            available,
            live_connected,
            herdr_connected,
            pi_connected,
            listening,
            task_active: active_task_id.is_some(),
            active_task_id,
            wake_activated,
            wake_generation: super::wake::generation(),
            workspace_id,
            message: message.into(),
        }
    }

    pub fn set_listening(&self, value: bool, app: &AppHandle) {
        self.0
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .listening = value;
        self.emit(app);
    }

    pub fn pet_state(&self, app: &AppHandle) -> OrchestratorPetState {
        let preferences = app.state::<PreferencesStore>().snapshot().preferences;
        let runtime = self.0.lock().unwrap_or_else(|error| error.into_inner());
        let configured = &preferences.app.orchestrator;
        OrchestratorPetState {
            active: configured.enabled && runtime.agent.is_some() && !runtime.launching,
            citizen_id: runtime.agent.as_ref().map(|agent| agent.public_id.clone()),
            pet_id: configured.pet_id.clone(),
            display_name: configured.display_name.clone(),
            listening: runtime.listening,
        }
    }

    pub fn emit(&self, app: &AppHandle) {
        let _ = app.emit("orchestrator-status", self.status());
        let _ = app.emit_to("main", "orchestrator-pet-state", self.pet_state(app));
    }

    pub fn mark_exiting(&self) {
        self.0
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .exiting = true;
    }

    pub fn shutdown(&self) -> bool {
        let agent = {
            let mut runtime = self.0.lock().unwrap_or_else(|error| error.into_inner());
            runtime.live_connected = false;
            runtime.listening = false;
            runtime.wake_activated = false;
            runtime.session_generation = runtime.session_generation.wrapping_add(1);
            runtime.lifecycle_generation = runtime.lifecycle_generation.wrapping_add(1);
            runtime.launching = false;
            runtime.launch_signature = None;
            runtime.agent.clone()
        };
        let Some(agent) = agent else {
            return self
                .0
                .lock()
                .unwrap_or_else(|error| error.into_inner())
                .cleanup_count
                == 0;
        };
        let closed = match agent.try_close() {
            Ok(()) => true,
            Err(error) => super::agent_response::terminal_missing(&error),
        };
        if !closed {
            return false;
        }
        let mut runtime = self.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime
            .agent
            .as_ref()
            .is_some_and(|item| item.pane_id == agent.pane_id)
        {
            runtime.agent = None;
            runtime.active_task_id = None;
            runtime.canceling_task_id = None;
            runtime.closing_agent_pane_id = None;
        }
        runtime.cleanup_count == 0
    }
}
