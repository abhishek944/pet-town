//! Voice admission, phase publication, and microphone runtime controls.
use super::{configured, FirstmateState, LISTENING, READY, SPEAKING, WORKING};
use std::sync::atomic::Ordering;
#[cfg(not(target_os = "macos"))]
use tauri::Emitter;
use tauri::{AppHandle, Manager};

pub fn phase(app: &AppHandle) -> u8 {
    app.state::<FirstmateState>().4.load(Ordering::SeqCst)
}

pub fn set_phase(app: &AppHandle, next: u8) {
    let state = app.state::<FirstmateState>();
    if state.4.swap(next, Ordering::SeqCst) != next {
        app.state::<super::super::state::OrchestratorState>()
            .emit(app);
    }
}

pub fn begin_listening(app: &AppHandle) -> Result<(), String> {
    app.state::<FirstmateState>()
        .4
        .compare_exchange(READY, LISTENING, Ordering::SeqCst, Ordering::SeqCst)
        .map_err(|_| "Mayor is finishing the current request. Wait for the reply.".to_string())?;
    app.state::<super::super::state::OrchestratorState>()
        .emit(app);
    Ok(())
}

#[tauri::command]
pub fn begin_firstmate_listening(app: AppHandle) -> Result<(), String> {
    configured(&app)?;
    begin_listening(&app)
}

#[tauri::command]
pub fn firstmate_phase(app: AppHandle) -> &'static str {
    match phase(&app) {
        LISTENING => "listening",
        WORKING => "working",
        SPEAKING => "speaking",
        _ => "ready",
    }
}

#[tauri::command]
pub fn set_firstmate_phase(value: String, app: AppHandle) -> Result<(), String> {
    configured(&app)?;
    let next = match value.as_str() {
        "ready" => READY,
        "working" => WORKING,
        "speaking" => SPEAKING,
        _ => return Err("Invalid Mayor voice phase.".into()),
    };
    set_phase(&app, next);
    Ok(())
}

#[tauri::command]
pub fn set_firstmate_talk(active: bool, app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        if active {
            configured(&app)?;
        }
        super::super::firstmate_talk::set(active, app)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let state = app.state::<FirstmateState>();
        if active {
            configured(&app)?;
            state.2.store(true, Ordering::SeqCst);
            app.state::<super::super::state::OrchestratorState>()
                .0
                .lock()
                .unwrap_or_else(|error| error.into_inner())
                .mayor_voice_status = "Starting microphone…".into();
            app.state::<super::super::state::OrchestratorState>()
                .emit(&app);
            if let Err(error) = super::super::window::open_hidden(&app) {
                state.2.store(false, Ordering::SeqCst);
                return Err(error);
            }
            // A release can arrive while the hidden WebView is starting.
            if !state.2.load(Ordering::SeqCst) {
                return Ok(());
            }
        } else {
            state.2.store(false, Ordering::SeqCst);
            app.state::<super::super::state::OrchestratorState>()
                .0
                .lock()
                .unwrap_or_else(|error| error.into_inner())
                .mayor_voice_status = "Ready · hold to talk".into();
            app.state::<super::super::state::OrchestratorState>()
                .emit(&app);
        }
        let _ = app.emit_to("orchestrator", "orchestrator-firstmate-talk", active);
        Ok(())
    }
}

#[tauri::command]
pub fn firstmate_talk_active(app: AppHandle) -> bool {
    app.state::<FirstmateState>().2.load(Ordering::SeqCst)
}

#[tauri::command]
pub fn firstmate_voice_ready(app: AppHandle) -> bool {
    app.state::<FirstmateState>().3.load(Ordering::SeqCst)
}
