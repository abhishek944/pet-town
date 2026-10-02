//! Public request admission, status, startup, and cancellation commands.
use super::{
    binding, configured, session::owned_session, set_phase, FirstmateState, READY, WORKING,
};
use std::{sync::atomic::Ordering, time::Duration};
use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
pub async fn start_firstmate(app: AppHandle) -> Result<(), String> {
    let target = app.clone();
    let busy = tauri::async_runtime::spawn_blocking(move || {
        let (agent, _, _) = owned_session(&target)?;
        let state = target.state::<FirstmateState>();
        let _admission = state.1.lock().unwrap_or_else(|error| error.into_inner());
        let info = super::super::herdr::command(
            &["agent".into(), "get".into(), agent],
            Duration::from_secs(5),
        )?;
        binding::reconcile(
            &mut state.0.lock().unwrap_or_else(|error| error.into_inner()),
            &info,
        )?;
        Ok::<bool, String>(!matches!(
            info["result"]["agent"]["agent_status"].as_str(),
            Some("idle" | "done")
        ))
    })
    .await
    .map_err(|_| "Could not start Firstmate.".to_string())??;
    set_phase(&app, if busy { WORKING } else { READY });
    app.state::<FirstmateState>()
        .3
        .store(true, Ordering::SeqCst);
    let _ = app.emit("orchestrator-status-refresh", ());
    Ok(())
}

#[tauri::command]
pub async fn send_firstmate_text(text: String, app: AppHandle) -> Result<(), String> {
    if text.trim().is_empty() || text.chars().count() > 10_000 {
        return Err("The spoken request is empty or too long.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let (agent, _, _) = owned_session(&app)?;
        let state = app.state::<FirstmateState>();
        let _admission = state.1.lock().unwrap_or_else(|e| e.into_inner());
        let info = super::super::herdr::command(
            &["agent".into(), "get".into(), agent.clone()],
            Duration::from_secs(5),
        )?;
        binding::reconcile(
            &mut state.0.lock().unwrap_or_else(|error| error.into_inner()),
            &info,
        )?;
        if !matches!(
            info["result"]["agent"]["agent_status"].as_str(),
            Some("idle" | "done")
        ) {
            return Err(
                "Firstmate is busy. Wait for its reply before sending another request.".into(),
            );
        }
        super::super::herdr::command(
            &["agent".into(), "prompt".into(), agent, text],
            Duration::from_secs(15),
        )
        .map(|_| ())
    })
    .await
    .map_err(|_| "Could not send request to Firstmate.".to_string())?
}

#[tauri::command]
pub async fn firstmate_agent_status(app: AppHandle) -> Result<String, String> {
    configured(&app)?;
    let agent = app
        .state::<FirstmateState>()
        .0
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .agent
        .clone();
    if agent.is_empty() {
        return Err("Firstmate is not connected.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let value = super::super::herdr::command(
            &["agent".into(), "get".into(), agent],
            Duration::from_secs(5),
        )?;
        value["result"]["agent"]["agent_status"]
            .as_str()
            .map(str::to_string)
            .ok_or_else(|| "Could not read Firstmate status.".into())
    })
    .await
    .map_err(|_| "Could not check Firstmate status.".to_string())?
}

pub fn interrupt(app: &AppHandle) -> Result<(), String> {
    configured(app)?;
    let agent = app
        .state::<FirstmateState>()
        .0
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .agent
        .clone();
    if agent.is_empty() {
        return Err("Firstmate is not connected.".into());
    }
    super::super::herdr::command(
        &["agent".into(), "send-keys".into(), agent, "esc".into()],
        Duration::from_secs(5),
    )
    .map(|_| ())
}
