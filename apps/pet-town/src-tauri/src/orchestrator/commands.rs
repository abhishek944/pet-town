use super::openai::LiveAnswer;
use super::state::OrchestratorState;
use crate::preferences::PreferencesStore;
use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
pub async fn start_orchestrator_session(
    workspace_id: String,
    sdp: String,
    wake_generation: Option<u64>,
    app: AppHandle,
) -> Result<LiveAnswer, String> {
    if super::openai::api_key().is_none() {
        return Err("Add an OpenAI API key in the environment or Pet Town Keychain entry.".into());
    }
    let configured = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    if !crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref()) {
        return Err("The bundled Mossback assistant pet is unavailable.".into());
    }
    let state = app.state::<OrchestratorState>();
    let generation = {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if let Some(wake) = wake_generation {
            if wake != super::wake::generation() || !runtime.wake_activated {
                return Err("Wake activation expired; say the wake phrase again.".into());
            }
            runtime.wake_activated = false;
        }
        runtime.session_generation = runtime.session_generation.wrapping_add(1);
        runtime.session_generation
    };
    super::launcher::ensure(app.clone(), workspace_id).await?;
    if state
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .session_generation
        != generation
    {
        return Err("Voice connection was canceled.".into());
    }
    let preferences = app.state::<PreferencesStore>().snapshot().preferences;
    let answer =
        super::openai::create_session(sdp, &preferences.app.orchestrator.display_name).await?;
    {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime.session_generation != generation {
            return Err("Voice connection was canceled.".into());
        }
        runtime.live_connected = true;
        runtime.wake_activated = false;
    }
    state.emit(&app);
    Ok(answer)
}

pub fn preferences_changed(app: &AppHandle) {
    let preferences = app.state::<PreferencesStore>().snapshot().preferences;
    let configured = &preferences.app.orchestrator;
    let state = app.state::<OrchestratorState>();
    {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime.agent.is_none() && !runtime.launching {
            runtime.lifecycle_generation = runtime.lifecycle_generation.wrapping_add(1);
        }
    }
    let signature = super::launcher::signature(configured);
    let changed = {
        let runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        let launch_changed =
            runtime.launching && runtime.launch_signature.as_deref() != Some(signature.as_str());
        launch_changed
            || runtime.agent.as_ref().is_some_and(|agent| {
                agent.display_name != configured.display_name
                    || agent.model != configured.model
                    || agent.thinking != configured.thinking
            })
    };
    if changed {
        let _ = app.emit_to("orchestrator", "orchestrator-reset", ());
        super::window::destroy(app);
        state.shutdown();
    }
    let pet_ready = crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref());
    if !configured.enabled {
        super::wake::stop(app);
        let _ = app.emit_to("orchestrator", "orchestrator-disable", ());
        super::window::destroy(app);
        state.shutdown();
    } else if !pet_ready {
        super::wake::stop(app);
        let _ = app.emit_to("orchestrator", "orchestrator-reset", ());
        state.shutdown();
    } else if configured.wake_enabled {
        let _ = super::wake::start(app, &configured.display_name);
    } else {
        super::wake::stop(app);
    }
    state.emit(app);
}
