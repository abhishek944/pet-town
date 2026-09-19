use super::state::OrchestratorState;
use crate::preferences::PreferencesStore;
use tauri::{AppHandle, Manager};

pub async fn ensure(app: AppHandle, workspace_id: String) -> Result<(), String> {
    let state = app.state::<OrchestratorState>();
    let admission = state
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .lifecycle_generation;
    let preferences = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    if !preferences.enabled {
        return Err("Enable the assistant in Settings first.".into());
    }
    if !crate::pet_studio::orchestrator_pet_ready(preferences.pet_id.as_deref()) {
        return Err("The bundled Mossback assistant pet is unavailable.".into());
    }
    let selected = workspace_id.clone();
    let available = tauri::async_runtime::spawn_blocking(super::herdr::workspaces)
        .await
        .map_err(|_| "Could not inspect Herdr workspaces.".to_string())??;
    let target = available
        .into_iter()
        .find(|item| item.id == selected)
        .ok_or_else(|| "Choose an available Herdr workspace.".to_string())?;
    let current = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    if current != preferences
        || !current.enabled
        || !crate::pet_studio::orchestrator_pet_ready(current.pet_id.as_deref())
    {
        return Err("The assistant changed while Pi was starting.".into());
    }
    let (existing, generation) = {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime.lifecycle_generation != admission {
            return Err("The assistant changed while Pi was starting.".into());
        }
        runtime.herdr_connected = true;
        if runtime.exiting {
            return Err("Pet Town is waiting to close safely.".into());
        }
        if runtime.launching {
            return Err("The Pi agent is already starting.".into());
        }
        if runtime.closing_agent_pane_id.is_some() {
            return Err("The previous Pi agent is still closing.".into());
        }
        runtime.launching = true;
        runtime.launch_signature = Some(signature(&preferences));
        runtime.selected_workspace_id = Some(workspace_id.clone());
        (runtime.agent.clone(), runtime.lifecycle_generation)
    };
    let matches = existing.as_ref().is_some_and(|agent| {
        agent.workspace_id == workspace_id
            && agent.display_name == preferences.display_name
            && agent.model == preferences.model
            && agent.thinking == preferences.thinking
    });
    if matches {
        let candidate = existing.clone().unwrap();
        let alive = tauri::async_runtime::spawn_blocking(move || candidate.alive())
            .await
            .map_err(|_| "Could not check the Pi agent.".to_string())?;
        if canceled(&state, generation) {
            return Err("The assistant changed while Pi was starting.".into());
        }
        match alive {
            Ok(true) => {
                clear_launching(&state, generation);
                return Ok(());
            }
            Err(error) => {
                clear_launching(&state, generation);
                return Err(error);
            }
            Ok(false) => {}
        }
    }
    if let Err(error) = super::launch_replace::close_stale(&state, generation).await {
        clear_launching(&state, generation);
        return Err(error);
    }
    let dedicated = match tauri::async_runtime::spawn_blocking(move || {
        super::herdr::dedicated(&target)
    })
    .await
    {
        Ok(result) => result,
        Err(_) => {
            clear_launching(&state, generation);
            return Err("Could not prepare the dedicated Herdr workspace.".into());
        }
    };
    let herdr_workspace_id = match dedicated {
        Ok(id) => id,
        Err(error) => {
            clear_launching(&state, generation);
            return Err(error);
        }
    };
    {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime.lifecycle_generation != generation {
            return Err("The assistant changed while Pi was starting.".into());
        }
        runtime.cleanup_count += 1;
    }
    let result =
        super::agent_launch::start(workspace_id, herdr_workspace_id, preferences.clone()).await;
    let agent = match result {
        Ok(agent) => agent,
        Err(error) => {
            super::agent_launch::decrement_cleanup(&app, &state);
            clear_launching(&state, generation);
            return Err(error);
        }
    };
    let invalidated = {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime.lifecycle_generation != generation {
            true
        } else {
            runtime.agent = Some(agent.clone());
            false
        }
    };
    if invalidated {
        super::launch_replace::close_new(&app, &state, agent).await;
        super::agent_launch::decrement_cleanup(&app, &state);
        return Err("The assistant changed while Pi was starting.".into());
    }
    super::agent_launch::decrement_cleanup(&app, &state);
    let initializing = agent.clone();
    let name = preferences.display_name.clone();
    let initialized = tauri::async_runtime::spawn_blocking(move || initializing.initialize(&name))
        .await
        .map_err(|_| "Could not initialize the Pi agent.".to_string());
    if canceled(&state, generation) {
        return Err("The assistant changed while Pi was starting.".into());
    }
    if let Err(error) = initialized.and_then(|value| value) {
        super::launch_replace::close_new(&app, &state, agent.clone()).await;
        super::agent_launch::take(&state, &agent.pane_id);
        clear_launching(&state, generation);
        return Err(error);
    }
    clear_launching(&state, generation);
    state.emit(&app);
    Ok(())
}

fn canceled(state: &OrchestratorState, generation: u64) -> bool {
    state
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .lifecycle_generation
        != generation
}
fn clear_launching(state: &OrchestratorState, generation: u64) {
    let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    if runtime.lifecycle_generation == generation {
        runtime.launching = false;
        runtime.launch_signature = None;
    }
}
pub(crate) fn signature(value: &crate::preferences_model::OrchestratorPreferences) -> String {
    format!(
        "{}\0{}\0{}",
        value.display_name, value.model, value.thinking
    )
}
