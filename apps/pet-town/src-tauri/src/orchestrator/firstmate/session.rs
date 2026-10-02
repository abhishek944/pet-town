//! Reconnect the exact owned agent, or replace it only after work has finished.
use super::{
    binding,
    configuration::{checkout, mayor_home},
    configured,
    ownership::restore,
    persist, FirstmateSession, FirstmateState,
};
use std::{path::PathBuf, time::Duration};
use tauri::{AppHandle, Manager};

pub(super) fn owned_session(app: &AppHandle) -> Result<(String, String, PathBuf), String> {
    let settings = configured(app)?;
    let path = settings
        .firstmate_path
        .as_deref()
        .ok_or("Choose a Firstmate folder in Mayor settings first.")?;
    if settings.trusted_firstmate_path.as_deref() != Some(path) {
        return Err("Choose and trust the Firstmate folder in Mayor settings first.".into());
    }
    let folder = checkout(path)?;
    let home = mayor_home(&folder)?;
    let state = app.state::<FirstmateState>();
    let _startup = state.1.lock().unwrap_or_else(|e| e.into_inner());
    let session = {
        let mut current = state.0.lock().unwrap_or_else(|e| e.into_inner());
        if current.agent.is_empty() {
            *current = restore()?;
        }
        current.clone()
    };
    if !session.agent.is_empty() {
        let info = super::super::herdr::command(
            &["agent".into(), "get".into(), session.agent.clone()],
            Duration::from_secs(5),
        );
        match info {
            Ok(value) => {
                binding::current_log(&session, &value)?;
                if session.path == folder.to_string_lossy()
                    && session.model == settings.model
                    && session.thinking == settings.thinking
                    && session.home == home.to_string_lossy()
                {
                    let mut current = state.0.lock().unwrap_or_else(|error| error.into_inner());
                    binding::reconcile(&mut current, &value)?;
                    return Ok((
                        current.agent.clone(),
                        current.pane.clone(),
                        current.log.clone(),
                    ));
                }
                if !matches!(
                    value["result"]["agent"]["agent_status"].as_str(),
                    Some("idle" | "done")
                ) {
                    return Err(
                        "Finish Firstmate's current work before changing its folder or model."
                            .into(),
                    );
                }
                super::super::herdr::command(
                    &["tab".into(), "close".into(), session.tab.clone()],
                    Duration::from_secs(5),
                )?;
                let mut current = state.0.lock().unwrap_or_else(|e| e.into_inner());
                *current = FirstmateSession::default();
                persist(&current)?;
            }
            Err(error) if super::super::agent_response::terminal_missing(&error) => {
                if !session.tab.is_empty() {
                    match super::super::herdr::command(
                        &["tab".into(), "close".into(), session.tab],
                        Duration::from_secs(5),
                    ) {
                        Ok(_) => {}
                        Err(error) if super::super::agent_response::terminal_missing(&error) => {}
                        Err(error) => return Err(error),
                    }
                }
                let mut current = state.0.lock().unwrap_or_else(|e| e.into_inner());
                *current = FirstmateSession::default();
                persist(&current)?;
            }
            Err(error) => {
                return Err(format!(
                    "Could not verify existing Firstmate session: {error}"
                ))
            }
        }
    }
    // Keep the startup lock held until the launched session has been persisted.
    super::startup::launch(app, settings, &folder, &home)
}
