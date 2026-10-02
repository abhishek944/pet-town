use super::{restart, GENERATION, PUBLICATION};
use crate::orchestrator::{openai, state, window};
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Manager};

pub(super) fn activate(app: AppHandle, generation: u64) -> Result<(), String> {
    let configured = app
        .state::<crate::preferences::PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    if generation != GENERATION.load(Ordering::SeqCst)
        || !configured.enabled
        || !configured.wake_enabled
    {
        return Err("Wake activation was canceled.".into());
    }
    if openai::api_key().is_none() {
        return Err("OpenAI key not found.".into());
    }
    if !crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref()) {
        return Err("The bundled Knight mayor is unavailable.".into());
    }
    let _publication = PUBLICATION
        .lock()
        .unwrap_or_else(|error| error.into_inner());
    let state = app.state::<state::OrchestratorState>();
    let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    if generation != GENERATION.load(Ordering::SeqCst) {
        return Err("Wake activation was canceled.".into());
    }
    let live = configured.mode == crate::preferences_model::MayorMode::Live;
    runtime.wake_activated = live;
    runtime.connecting = live;
    runtime.wake_status = Some(
        if live {
            "Wake phrase heard — connecting voice"
        } else {
            "Wake phrase heard — hold to talk"
        }
        .into(),
    );
    runtime.mayor_speech.clear();
    runtime.mayor_speaking = false;
    drop(runtime);
    window::open_hidden(&app).inspect_err(|_| {
        let mut runtime = state.0.lock().unwrap_or_else(|reason| reason.into_inner());
        runtime.wake_activated = false;
        runtime.connecting = false;
    })?;
    state.focus_mayor(&app);
    drop(_publication);
    if !live {
        restart(&app);
    }
    Ok(())
}
