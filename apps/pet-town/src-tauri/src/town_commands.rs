use crate::{orchestrator, preferences::PreferencesStore, preferences_model::MayorMode};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

#[tauri::command]
pub(crate) fn quit_pet_town(app: AppHandle) {
    app.exit(0);
}

pub(crate) fn require_town(window: &WebviewWindow) -> Result<(), String> {
    if window.label() != crate::town_process::TOWN_LABEL
        || !window
            .url()
            .is_ok_and(|url| crate::town_process::allowed_url(&url))
    {
        return Err("This command is available only in the local Pet Town.".into());
    }
    Ok(())
}

#[tauri::command]
pub(crate) async fn town_action(
    app: AppHandle,
    window: WebviewWindow,
    action: String,
    active: Option<bool>,
    mode: Option<String>,
    id: Option<String>,
) -> Result<(), String> {
    require_town(&window)?;
    dispatch(app, action, active, mode, id).await
}

pub(crate) async fn dispatch(
    app: AppHandle,
    action: String,
    active: Option<bool>,
    mode: Option<String>,
    id: Option<String>,
) -> Result<(), String> {
    match action.as_str() {
        "invokeMayor" => orchestrator::invoke::invoke_mayor(&app),
        "mayorTalk" => {
            crate::town_voice::request_talk(app, active.ok_or("mayorTalk requires active.")?).await
        }
        "mayorRetryVoice" => app
            .emit_to("orchestrator", "orchestrator-firstmate-retry", ())
            .map_err(|error| error.to_string()),
        "setMayorMode" => set_mode(&app, mode.as_deref().ok_or("setMayorMode requires mode.")?),
        "openMayorSettings" => {
            crate::settings_window::open_internal(&app, None, Some("assistant".into()))
        }
        "focusAgent" => {
            let id = id.ok_or("focusAgent requires id.")?;
            if id.trim().is_empty() || id.len() > 256 {
                return Err("Agent ID is invalid.".into());
            }
            crate::focus::focus_agent(id).await
        }
        "stopMayor" => crate::town_voice::stop_conversation(&app),
        _ => Err("Unknown town action.".into()),
    }
}

fn set_mode(app: &AppHandle, mode: &str) -> Result<(), String> {
    let mode = match mode {
        "firstmate" => MayorMode::Firstmate,
        "live" => MayorMode::Live,
        _ => return Err("Mayor mode must be firstmate or live.".into()),
    };
    let store = app.state::<PreferencesStore>();
    let mut snapshot = store.snapshot();
    if snapshot.preferences.app.orchestrator.mode == mode {
        return Ok(());
    }
    crate::town_voice::release_talk(app);
    snapshot.preferences.app.orchestrator.mode = mode;
    crate::preferences_commands::apply_preferences(
        snapshot.preferences,
        snapshot.revision,
        app.clone(),
        store,
    )?;
    Ok(())
}
