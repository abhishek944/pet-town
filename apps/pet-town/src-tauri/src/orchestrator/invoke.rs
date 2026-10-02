use super::state::OrchestratorState;
use crate::preferences::PreferencesStore;
use tauri::{AppHandle, Emitter, Manager};

pub fn invoke_mayor(app: &AppHandle) -> Result<(), String> {
    let configured = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    if !configured.enabled {
        return Err("The mayor is stopped. Start it in Settings first.".into());
    }
    if super::openai::api_key().is_none() {
        return Err("OpenAI key not found.".into());
    }
    if !crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref()) {
        return Err("The bundled Knight mayor is unavailable.".into());
    }
    let state = app.state::<OrchestratorState>();
    let mut starting = false;
    {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if configured.mode == crate::preferences_model::MayorMode::Live
            && !runtime.live_connected
            && !runtime.connecting
        {
            starting = true;
            runtime.wake_activated = true;
            runtime.connecting = true;
            runtime.degraded_note = None;
            runtime.wake_status = Some("Mayor called — connecting voice".into());
            runtime.mayor_speech.clear();
            runtime.mayor_speaking = false;
        }
    }
    if let Err(error) = super::window::open_hidden(app) {
        if starting {
            let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
            runtime.wake_activated = false;
            runtime.connecting = false;
        }
        state.emit(app);
        return Err(error);
    }
    state.focus_mayor(app);
    let _ = app.emit_to("orchestrator", "orchestrator-mayor-invoked", ());
    Ok(())
}
