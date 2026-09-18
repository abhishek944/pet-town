use super::agent::AgentSession;
use super::status_types::{OrchestratorPetState, OrchestratorStatus};
use crate::preferences::PreferencesStore;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Default)]
pub struct Runtime {
    pub agent: Option<AgentSession>,
    pub herdr_connected: bool,
    pub live_connected: bool,
    pub listening: bool,
    pub wake_activated: bool,
    pub wake_status: Option<String>,
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

impl OrchestratorState {
    pub fn observed_status(
        &self,
        app: &AppHandle,
        herdr_connected: bool,
        observed_generation: u64,
        observed_pane: Option<&str>,
        observed_pi: bool,
    ) -> OrchestratorStatus {
        let (
            launching,
            live_connected,
            listening,
            active_task_id,
            wake_activated,
            wake_status,
            workspace_id,
            pi_model,
            pi_thinking,
            lifecycle_generation,
            current_pane,
        ) = {
            let runtime = self.0.lock().unwrap_or_else(|error| error.into_inner());
            (
                runtime.launching,
                runtime.live_connected,
                runtime.listening,
                runtime.active_task_id.clone(),
                runtime.wake_activated,
                runtime.wake_status.clone(),
                runtime.selected_workspace_id.clone(),
                runtime.agent.as_ref().map(|agent| agent.model.clone()),
                runtime.agent.as_ref().map(|agent| agent.thinking.clone()),
                runtime.lifecycle_generation,
                runtime.agent.as_ref().map(|agent| agent.pane_id.clone()),
            )
        };
        let pi_connected = !launching
            && lifecycle_generation == observed_generation
            && current_pane.as_deref() == observed_pane
            && observed_pi;
        let preferences = app.state::<PreferencesStore>().snapshot().preferences;
        let available = super::openai::api_key().is_some();
        let pet_ready = crate::pet_studio::orchestrator_pet_ready(
            preferences.app.orchestrator.pet_id.as_deref(),
        );
        let message = if !available {
            "OpenAI key not found"
        } else if !pet_ready {
            "Assistant pet required"
        } else if live_connected && !pi_connected {
            "Pi stopped — disconnect and reconnect voice"
        } else if live_connected {
            "Voice connected"
        } else if pi_connected {
            "Pi running"
        } else if herdr_connected && preferences.app.orchestrator.enabled {
            wake_status.as_deref().unwrap_or("Starting wake listener")
        } else if herdr_connected {
            "Ready to enable"
        } else {
            "Herdr unavailable"
        };
        OrchestratorStatus {
            available,
            pet_ready,
            live_connected,
            herdr_connected,
            pi_connected,
            pi_model: pi_connected.then_some(pi_model).flatten(),
            pi_thinking: pi_connected.then_some(pi_thinking).flatten(),
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
        let configured = &preferences.app.orchestrator;
        let pet_ready = crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref());
        let runtime = self.0.lock().unwrap_or_else(|error| error.into_inner());
        OrchestratorPetState {
            active: configured.enabled
                && pet_ready
                && runtime.agent.is_some()
                && !runtime.launching,
            citizen_id: runtime.agent.as_ref().map(|agent| agent.public_id.clone()),
            pet_id: configured.pet_id.clone(),
            display_name: configured.display_name.clone(),
            listening: runtime.listening,
        }
    }

    pub fn emit(&self, app: &AppHandle) {
        let _ = app.emit("orchestrator-status-refresh", ());
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
            runtime.wake_status = None;
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
