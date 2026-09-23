use super::state::OrchestratorState;
use super::status_types::OrchestratorPetState;
use crate::preferences::PreferencesStore;
use std::sync::Mutex;
use tauri::Manager;
use tauri::{AppHandle, Emitter};

static MAYOR_PUBLICATION: Mutex<()> = Mutex::new(());

pub fn publish(state: &OrchestratorState, app: &AppHandle) {
    let _publication = MAYOR_PUBLICATION
        .lock()
        .unwrap_or_else(|error| error.into_inner());
    let _ = app.emit("orchestrator-status-refresh", ());
    let pet = state.pet_state(app);
    let _ = app.emit_to("main", "orchestrator-pet-state", pet.clone());
    let serial = state
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .mayor_focus_serial;
    if let Ok(path) = crate::preferences_io::preferences_path() {
        let path = path.with_file_name("mayor-state.json");
        let temporary = path.with_file_name(format!("mayor-state.{}.tmp", std::process::id()));
        let payload = serde_json::json!({
            "ownerPid": std::process::id(),
            "active": pet.active,
            "name": pet.display_name,
            "listening": pet.listening,
            "focusSerial": serial,
        });
        if let Ok(bytes) = serde_json::to_vec(&payload) {
            if std::fs::write(&temporary, bytes).is_ok() {
                let _ = std::fs::rename(&temporary, &path);
            }
        }
    }
}

pub fn pet_state(state: &OrchestratorState, app: &AppHandle) -> OrchestratorPetState {
    let preferences = app.state::<PreferencesStore>().snapshot().preferences;
    let configured = &preferences.app.orchestrator;
    let pet_ready = crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref());
    let runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    OrchestratorPetState {
        active: configured.enabled
            && pet_ready
            && (runtime.connecting || runtime.live_connected || runtime.agent.is_some()),
        citizen_id: Some(
            runtime
                .agent
                .as_ref()
                .map(|agent| agent.public_id.clone())
                .unwrap_or_else(|| "pet-town-assistant".into()),
        ),
        pet_id: configured.pet_id.clone(),
        display_name: configured.display_name.clone(),
        listening: runtime.listening,
    }
}

impl OrchestratorState {
    pub fn focus_mayor(&self, app: &AppHandle) {
        let mut runtime = self.0.lock().unwrap_or_else(|error| error.into_inner());
        runtime.mayor_focus_serial = runtime.mayor_focus_serial.wrapping_add(1);
        drop(runtime);
        self.emit(app);
    }
}
