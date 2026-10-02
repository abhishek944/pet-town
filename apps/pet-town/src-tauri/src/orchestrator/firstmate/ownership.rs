//! Durable session ownership and guarded shutdown of an idle owned tab.
use super::{configured, FirstmateSession, FirstmateState};
use std::{fs, path::PathBuf, sync::atomic::Ordering, time::Duration};
use tauri::{AppHandle, Manager};

fn ownership_file() -> Result<PathBuf, String> {
    Ok(crate::preferences_io::preferences_path()?.with_file_name("firstmate-session.json"))
}

pub(super) fn persist(session: &FirstmateSession) -> Result<(), String> {
    let path = ownership_file()?;
    let temporary = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec(session)
        .map_err(|_| "Could not save Firstmate ownership.".to_string())?;
    fs::write(&temporary, bytes).map_err(|_| "Could not save Firstmate ownership.".to_string())?;
    fs::rename(temporary, path).map_err(|_| "Could not save Firstmate ownership.".to_string())
}

pub(super) fn restore() -> Result<FirstmateSession, String> {
    let path = ownership_file()?;
    match fs::read(path) {
        Ok(bytes) => serde_json::from_slice(&bytes).map_err(|_| {
            "Firstmate ownership record is invalid; inspect it before launching a replacement."
                .into()
        }),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            Ok(FirstmateSession::default())
        }
        Err(_) => Err("Could not inspect Firstmate ownership record.".into()),
    }
}

pub fn close(app: &AppHandle) {
    let state = app.state::<FirstmateState>();
    state.3.store(false, Ordering::SeqCst);
    let session = {
        let mut current = state.0.lock().unwrap_or_else(|e| e.into_inner());
        if current.agent.is_empty() {
            if let Ok(saved) = restore() {
                *current = saved;
            }
        }
        current.clone()
    };
    if session.tab.is_empty() {
        return;
    }
    let state = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let current = state.state::<FirstmateState>();
        let _startup = current.1.lock().unwrap_or_else(|e| e.into_inner());
        if configured(&state).is_ok()
            || current.0.lock().unwrap_or_else(|e| e.into_inner()).tab != session.tab
        {
            return;
        }
        let info = super::super::herdr::command(
            &["agent".into(), "get".into(), session.agent.clone()],
            Duration::from_secs(5),
        );
        if !info.as_ref().is_ok_and(|value| {
            matches!(
                value["result"]["agent"]["agent_status"].as_str(),
                Some("idle" | "done" | "blocked")
            )
        }) {
            // Do not cancel work or assume death when Herdr status is uncertain.
            return;
        }
        if super::super::herdr::command(
            &["tab".into(), "close".into(), session.tab.clone()],
            Duration::from_secs(5),
        )
        .is_ok()
        {
            let current = state.state::<FirstmateState>();
            let mut owned = current.0.lock().unwrap_or_else(|e| e.into_inner());
            if owned.tab == session.tab {
                *owned = FirstmateSession::default();
                let _ = persist(&owned);
            }
        }
    });
}
