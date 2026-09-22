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
        return Err("The bundled Knight assistant is unavailable.".into());
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
        runtime.connecting = true;
        runtime.session_generation = runtime.session_generation.wrapping_add(1);
        runtime.session_generation
    };
    state.emit(&app);
    let preferences = app.state::<PreferencesStore>().snapshot().preferences;
    // An empty id means the default session folder; a leading slash marks a
    // picked session folder rather than a workspace id.
    let workspace_id = if workspace_id.is_empty() {
        default_session_folder()?
    } else {
        workspace_id
    };
    let workspace_id = if workspace_id.starts_with('/') {
        super::herdr::workspace_for_folder(&workspace_id)?
    } else {
        workspace_id
    };
    // Start Pi and negotiate voice concurrently; neither requires the other.
    let (pi, voice) = futures_util::future::join(
        super::launcher::ensure(app.clone(), workspace_id),
        super::openai::create_session(sdp, &preferences.app.orchestrator.display_name),
    ).await;
    pi?;
    let (result, note) = voice;
    {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        runtime.responses_backend = note.is_none() && result.is_ok();
        runtime.degraded_note = note;
    }
    let answer = result?;
    {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime.session_generation != generation {
            return Err("Voice connection was canceled.".into());
        }
        runtime.live_connected = true;
        runtime.connecting = false;
        runtime.wake_activated = false;
    }
    state.emit(&app);
    Ok(answer)
}

#[tauri::command]
pub fn rearm_orchestrator_voice(app: AppHandle) -> Result<String, String> {
    if super::openai::api_key().is_none() {
        return Err("Add an OpenAI API key in the environment or Pet Town Keychain entry.".into());
    }
    let configured = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    if !configured.enabled {
        return Err("The assistant is stopped. Start it first.".into());
    }
    if !crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref()) {
        return Err("The bundled Knight assistant is unavailable.".into());
    }
    super::window::open_hidden(&app)?;
    super::wake::start(&app, &configured.display_name)?;
    app.state::<OrchestratorState>().emit(&app);
    Ok(format!(
        "Listening for \u{201c}Hey, {}\u{201d}. Say the wake phrase to start talking.",
        configured.display_name.trim()
    ))
}

fn default_session_folder() -> Result<String, String> {
    let home = std::env::var("HOME")
        .map_err(|_| "Your home folder is unavailable; choose a session folder in Settings.".to_string())?;
    Ok(format!("{home}/Documents"))
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
        // Extract and verify the bundled runtime before a wake phrase arrives.
        tauri::async_runtime::spawn_blocking(|| {
            if let Err(error) = super::runtime::directory() {
                eprintln!("[assistant runtime] {error}");
            }
        });
        let _ = super::wake::start(app, &configured.display_name);
    } else {
        super::wake::stop(app);
    }
    state.emit(app);
}
