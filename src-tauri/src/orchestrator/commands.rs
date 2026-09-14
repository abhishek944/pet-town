use super::openai::LiveAnswer;
use super::state::OrchestratorState;
use crate::preferences::PreferencesStore;
use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
pub async fn open_orchestrator(app: AppHandle) -> Result<(), String> {
    super::window::open(&app)?;
    let preferences = app.state::<PreferencesStore>().snapshot().preferences;
    if preferences.app.orchestrator.enabled && preferences.app.orchestrator.wake_enabled {
        let _ = super::wake::start(&app, &preferences.app.orchestrator.display_name);
    }
    app.state::<OrchestratorState>().emit(&app);
    Ok(())
}

#[tauri::command]
pub fn show_orchestrator(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("orchestrator")
        .ok_or_else(|| "Conversation window is unavailable.".to_string())?;
    window
        .show()
        .and_then(|_| window.center())
        .and_then(|_| window.set_focus())
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn start_orchestrator_session(
    workspace_id: String,
    sdp: String,
    wake_generation: Option<u64>,
    app: AppHandle,
) -> Result<LiveAnswer, String> {
    if super::openai::api_key().is_none() {
        return Err(
            "Add an OpenAI API key in the environment or Pet Village Keychain entry.".into(),
        );
    }
    let state = app.state::<OrchestratorState>();
    let generation = {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if let Some(wake) = wake_generation {
            if wake != super::wake::generation() || !runtime.wake_activated {
                return Err("Wake activation expired; use the wake phrase again.".into());
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

#[tauri::command]
pub fn test_wake_phrase(name: String, app: AppHandle) -> Result<(), String> {
    let name = name.trim();
    if name.is_empty() || name.chars().count() > 32 || name.chars().any(char::is_control) {
        return Err("Choose a safe orchestrator name before testing its wake phrase.".into());
    }
    super::wake::test(&app, name)
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
        state.shutdown();
    }
    if !configured.enabled {
        super::wake::stop(app);
        let _ = app.emit_to("orchestrator", "orchestrator-disable", ());
        state.shutdown();
    } else if configured.wake_enabled {
        let _ = super::wake::start(app, &configured.display_name);
    } else {
        super::wake::stop(app);
    }
    if configured.enabled {
        let handle = app.clone();
        tauri::async_runtime::spawn(async move {
            let _ = super::launcher::ensure_default(handle).await;
        });
    }
    state.emit(app);
}
