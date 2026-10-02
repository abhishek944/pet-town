use super::{configured, persist, FirstmateSession, FirstmateState};
use serde_json::Value;
use std::{
    fs::File,
    io::{BufRead, BufReader, Read},
    path::{Path, PathBuf},
    time::Duration,
};
use tauri::{AppHandle, Manager};

pub(super) fn current_log(session: &FirstmateSession, value: &Value) -> Result<PathBuf, String> {
    let agent = &value["result"]["agent"];
    let identity = &agent["agent_session"];
    if agent["name"].as_str() != Some(&session.agent)
        || agent["pane_id"].as_str() != Some(&session.pane)
        || agent["tab_id"].as_str() != Some(&session.tab)
        || agent["agent"] != "pi"
        || identity["agent"] != "pi"
        || identity["kind"] != "path"
    {
        return Err(
            "The saved Firstmate identity changed; inspect the tab before retrying.".into(),
        );
    }
    let log = identity["value"]
        .as_str()
        .map(PathBuf::from)
        .ok_or("Herdr omitted the current Firstmate session path.")?;
    if !log.is_absolute() || log.extension().is_none_or(|ext| ext != "jsonl") {
        return Err("Herdr returned an invalid Firstmate session path.".into());
    }
    Ok(log)
}

fn baseline(log: &Path, folder: &str) -> Result<u64, String> {
    let file = match File::open(log) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(0),
        Err(_) => return Err("Could not inspect the current Firstmate session log.".into()),
    };
    let length = file
        .metadata()
        .map_err(|_| "Could not inspect Firstmate log.")?
        .len();
    let mut header = Vec::new();
    BufReader::new(file)
        .take(16_384)
        .read_until(b'\n', &mut header)
        .map_err(|_| "Could not read the Firstmate session header.")?;
    let value: Value = serde_json::from_slice(&header)
        .map_err(|_| "The current Firstmate session header is not ready. Try again.")?;
    let cwd = value["cwd"]
        .as_str()
        .and_then(|path| Path::new(path).canonicalize().ok());
    if value["type"] != "session" || cwd.as_deref() != Some(Path::new(folder)) {
        return Err("The current Firstmate log belongs to a different folder.".into());
    }
    Ok(length)
}

/// Called under the admission lock. Publish a new binding only after persistence succeeds.
pub(super) fn reconcile(session: &mut FirstmateSession, value: &Value) -> Result<(), String> {
    let log = current_log(session, value)?;
    if log == session.log && !session.session_token.is_empty() {
        return Ok(());
    }
    let mut next = session.clone();
    if log != session.log {
        next.offset = baseline(&log, &session.path)?;
        next.log = log;
    }
    next.session_token = uuid::Uuid::new_v4().to_string();
    persist(&next)?;
    *session = next;
    Ok(())
}

/// Subprocess and file reads stay off the GUI thread and serialize with request admission.
pub(super) async fn with_current<T: Send + 'static>(
    app: AppHandle,
    read: impl FnOnce(&mut FirstmateSession) -> Result<T, String> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<FirstmateState>();
        let _admission = state.1.lock().unwrap_or_else(|error| error.into_inner());
        let settings = configured(&app)?;
        let saved = state
            .0
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .clone();
        if !saved.agent.is_empty() {
            let selected = settings
                .firstmate_path
                .as_deref()
                .and_then(|path| Path::new(path).canonicalize().ok());
            if selected.as_deref() != Some(Path::new(&saved.path)) {
                return Err(
                    "The Firstmate folder changed. Call Mayor again before retrying.".into(),
                );
            }
            let value = super::super::herdr::command(
                &["agent".into(), "get".into(), saved.agent],
                Duration::from_secs(5),
            )?;
            reconcile(
                &mut state.0.lock().unwrap_or_else(|error| error.into_inner()),
                &value,
            )?;
        }
        let mut current = state.0.lock().unwrap_or_else(|error| error.into_inner());
        read(&mut current)
    })
    .await
    .map_err(|_| "Could not inspect the current Firstmate session.".to_string())?
}
