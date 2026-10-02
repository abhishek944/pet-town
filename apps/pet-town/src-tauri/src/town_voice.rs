use crate::{
    orchestrator, preferences::PreferencesStore, preferences_model::MayorMode,
    town_process::TownWindowState,
};
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Emitter, Manager};
mod request;
pub(crate) use request::{request_talk, TownTalkState};

fn set_talk(app: &AppHandle, active: bool) -> Result<u64, String> {
    let state = app.state::<TownWindowState>();
    // Query the native window before locking: window queries may need the main
    // thread, whose focus event also releases this microphone ownership.
    let focused = !active
        || app
            .get_webview_window(crate::town_process::TOWN_LABEL)
            .is_some_and(|window| window.is_focused().unwrap_or(false));
    let mut held = state
        .talking
        .lock()
        .map_err(|_| "Town microphone state is unavailable.")?;
    if active {
        let settings = app
            .state::<PreferencesStore>()
            .snapshot()
            .preferences
            .app
            .orchestrator;
        if !settings.enabled || settings.mode != MayorMode::Firstmate {
            return Err("Hold to talk requires an enabled Mayor in Standard mode.".into());
        }
        if settings.firstmate_path.is_none()
            || settings.firstmate_path != settings.trusted_firstmate_path
        {
            return Err("Choose and trust the Firstmate folder in Mayor settings first.".into());
        }
        if !orchestrator::firstmate::firstmate_voice_ready(app.clone()) {
            return Err(
                "Firstmate is still starting. Call Mayor and try again in a moment.".into(),
            );
        }
        if !held.requested && orchestrator::firstmate::phase(app) != orchestrator::firstmate::READY
        {
            return Err("Mayor is finishing the current request. Wait for the reply.".into());
        }
        if !focused || !state.active.load(Ordering::SeqCst) {
            return Err("Focus the town before starting a recording.".into());
        }
    }
    if held.requested == active {
        return Ok(held.generation);
    }
    // Keep the existing town/global input merge; releasing the town button must
    // not interrupt a recording while Control+Option remains held.
    crate::control::set_town_talk(active);
    held.requested = active;
    held.observed_listening = false;
    held.generation = held.generation.wrapping_add(1);
    Ok(held.generation)
}

/// Called after the control loop applies its merged town/global microphone input.
pub(crate) fn talk_applied(app: &AppHandle, town_active: bool, error: Option<String>) {
    let state = app.state::<TownWindowState>();
    let mut held = state
        .talking
        .lock()
        .unwrap_or_else(|error| error.into_inner());
    if held.requested != town_active {
        return;
    }
    held.applied_generation = held.generation;
    if !held.requested {
        return;
    }
    if orchestrator::firstmate::phase(app) == orchestrator::firstmate::LISTENING {
        held.observed_listening = true;
        return;
    }
    if !held.observed_listening {
        held.failure = Some((
            held.generation,
            error.unwrap_or_else(|| {
                "Mayor could not start recording. Check the voice status and try again.".into()
            }),
        ));
    }
    // A rejected start or the native 30-second limit must release the source
    // claim too, otherwise the next click cannot create a new recording edge.
    crate::control::set_town_talk(false);
    held.requested = false;
    held.observed_listening = false;
    held.generation = held.generation.wrapping_add(1);
}

pub(crate) fn talk_snapshot(app: &AppHandle) -> (bool, bool, u64) {
    let state = app.state::<TownWindowState>();
    let held = state
        .talking
        .lock()
        .unwrap_or_else(|error| error.into_inner());
    (
        held.requested,
        held.applied_generation == held.generation,
        held.generation,
    )
}

pub(crate) fn release_talk(app: &AppHandle) {
    if let Err(error) = set_talk(app, false) {
        eprintln!("[town microphone] {error}");
    }
}

pub(crate) fn stop_conversation(app: &AppHandle) -> Result<(), String> {
    release_talk(app);
    orchestrator::firstmate::set_firstmate_talk(false, app.clone())?;
    app.emit_to("orchestrator", "orchestrator-reset", ())
        .map_err(|error| error.to_string())?;
    orchestrator::firstmate_audio::stop_firstmate_audio(app.clone());
    // Destroy the voice page so the next invocation starts a fresh voice session.
    // The Firstmate primary lives independently in Herdr and is not closed.
    if let Some(window) = app.get_webview_window("orchestrator") {
        window.destroy().map_err(|error| error.to_string())?;
    }
    app.state::<orchestrator::firstmate::FirstmateState>()
        .3
        .store(false, Ordering::SeqCst);
    if orchestrator::firstmate::phase(app) != orchestrator::firstmate::WORKING {
        orchestrator::firstmate::set_phase(app, orchestrator::firstmate::READY);
    }
    orchestrator::task_cancel::stop_orchestrator_session(app.clone());
    orchestrator::status_commands::set_mayor_voice_status("Voice stopped".into(), app.clone());
    Ok(())
}
