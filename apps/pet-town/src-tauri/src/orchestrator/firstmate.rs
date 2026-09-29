//! The Firstmate primary agent is a separate, persistent Pi session in the selected checkout.
//! Only completed assistant text from Pi's structured session log is exposed to speech.
use crate::preferences::PreferencesStore;
use base64::Engine;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::{BufRead, BufReader, Read, Seek, SeekFrom},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, AtomicU8, Ordering},
        Mutex,
    },
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Default)]
pub struct FirstmateState(
    pub Mutex<FirstmateSession>,
    pub Mutex<()>,
    pub AtomicBool,
    pub AtomicBool,
    pub AtomicU8,
);

pub const READY: u8 = 0;
pub const LISTENING: u8 = 1;
pub const WORKING: u8 = 2;
pub const SPEAKING: u8 = 3;

pub fn phase(app: &AppHandle) -> u8 {
    app.state::<FirstmateState>().4.load(Ordering::SeqCst)
}

pub fn set_phase(app: &AppHandle, next: u8) {
    let state = app.state::<FirstmateState>();
    if state.4.swap(next, Ordering::SeqCst) != next {
        app.state::<super::state::OrchestratorState>().emit(app);
    }
}

pub fn begin_listening(app: &AppHandle) -> Result<(), String> {
    app.state::<FirstmateState>()
        .4
        .compare_exchange(READY, LISTENING, Ordering::SeqCst, Ordering::SeqCst)
        .map_err(|_| "Mayor is finishing the current request. Wait for the reply.".to_string())?;
    app.state::<super::state::OrchestratorState>().emit(app);
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
        return super::firstmate_talk::set(active, app);
    }
    #[cfg(not(target_os = "macos"))]
    {
        let state = app.state::<FirstmateState>();
        if active {
            configured(&app)?;
            state.2.store(true, Ordering::SeqCst);
            app.state::<super::state::OrchestratorState>()
                .0
                .lock()
                .unwrap_or_else(|error| error.into_inner())
                .mayor_voice_status = "Starting microphone…".into();
            app.state::<super::state::OrchestratorState>().emit(&app);
            if let Err(error) = super::window::open_hidden(&app) {
                state.2.store(false, Ordering::SeqCst);
                return Err(error);
            }
            // A release can arrive while the hidden WebView is starting.
            if !state.2.load(Ordering::SeqCst) {
                return Ok(());
            }
        } else {
            state.2.store(false, Ordering::SeqCst);
            app.state::<super::state::OrchestratorState>()
                .0
                .lock()
                .unwrap_or_else(|error| error.into_inner())
                .mayor_voice_status = "Ready · hold to talk".into();
            app.state::<super::state::OrchestratorState>().emit(&app);
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

#[derive(Clone, Default, Deserialize, Serialize)]
pub struct FirstmateSession {
    path: String,
    tab: String,
    pane: String,
    agent: String,
    log: PathBuf,
    offset: u64,
    model: String,
    thinking: String,
    #[serde(default)]
    home: String,
}

fn ownership_file() -> Result<PathBuf, String> {
    Ok(crate::preferences_io::preferences_path()?.with_file_name("firstmate-session.json"))
}

fn persist(session: &FirstmateSession) -> Result<(), String> {
    let path = ownership_file()?;
    let temporary = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec(session)
        .map_err(|_| "Could not save Firstmate ownership.".to_string())?;
    fs::write(&temporary, bytes).map_err(|_| "Could not save Firstmate ownership.".to_string())?;
    fs::rename(temporary, path).map_err(|_| "Could not save Firstmate ownership.".to_string())
}

fn restore() -> Result<FirstmateSession, String> {
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

fn configured(
    app: &AppHandle,
) -> Result<crate::preferences_model::OrchestratorPreferences, String> {
    let settings = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    if !settings.enabled {
        return Err("Start Mayor first.".into());
    }
    if settings.firstmate_path.is_none()
        || settings.firstmate_path != settings.trusted_firstmate_path
    {
        return Err("Choose and trust the Firstmate folder in Mayor settings first.".into());
    }
    Ok(settings)
}

fn checkout(path: &str) -> Result<PathBuf, String> {
    let folder = Path::new(path)
        .canonicalize()
        .map_err(|_| "Choose an existing Firstmate folder.".to_string())?;
    if !folder.join("AGENTS.md").is_file() || !folder.join(".pi").is_dir() {
        return Err("Choose the Firstmate checkout containing AGENTS.md and .pi.".into());
    }
    Ok(folder)
}

fn mayor_home(folder: &Path) -> Result<PathBuf, String> {
    let preferences = crate::preferences_io::preferences_path()?;
    let root = preferences
        .parent()
        .ok_or("Pet Town preferences folder is unavailable.")?;
    let digest = hex::encode(Sha256::digest(folder.to_string_lossy().as_bytes()));
    let home = root.join("firstmate-mayor").join(&digest[..16]);
    fs::create_dir_all(&home)
        .map_err(|_| "Could not prepare the Mayor's isolated Firstmate home.".to_string())?;
    Ok(home)
}

fn field<'a>(value: &'a Value, keys: &[&str]) -> Result<&'a str, String> {
    keys.iter()
        .try_fold(value, |item, key| item.get(*key))
        .and_then(Value::as_str)
        .ok_or_else(|| "Herdr omitted the Firstmate session identifier.".into())
}

fn owned_session(app: &AppHandle) -> Result<(String, String, PathBuf), String> {
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
        let info = super::herdr::command(
            &["agent".into(), "get".into(), session.agent.clone()],
            Duration::from_secs(5),
        );
        match info {
            Ok(value)
                if value["result"]["agent"]["pane_id"].as_str() == Some(&session.pane)
                    && session.log.extension().is_some_and(|ext| ext == "jsonl") =>
            {
                if session.path == folder.to_string_lossy()
                    && session.model == settings.model
                    && session.thinking == settings.thinking
                    && session.home == home.to_string_lossy()
                {
                    return Ok((session.agent, session.pane, session.log));
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
                super::herdr::command(
                    &["tab".into(), "close".into(), session.tab.clone()],
                    Duration::from_secs(5),
                )?;
                let mut current = state.0.lock().unwrap_or_else(|e| e.into_inner());
                *current = FirstmateSession::default();
                persist(&current)?;
            }
            Ok(_) => return Err(
                "The saved Firstmate session identity changed; inspect the tab before retrying."
                    .into(),
            ),
            Err(error) if super::agent_response::terminal_missing(&error) => {
                if !session.tab.is_empty() {
                    match super::herdr::command(
                        &["tab".into(), "close".into(), session.tab],
                        Duration::from_secs(5),
                    ) {
                        Ok(_) => {}
                        Err(error) if super::agent_response::terminal_missing(&error) => {}
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
    let workspace = super::herdr::workspace_for_folder(
        folder.to_str().ok_or("Invalid Firstmate folder path.")?,
    )?;
    let args = vec![
        "tab".into(),
        "create".into(),
        "--workspace".into(),
        workspace,
        "--cwd".into(),
        folder.to_string_lossy().into_owned(),
        "--label".into(),
        "Firstmate mayor".into(),
        "--no-focus".into(),
        "--env".into(),
        "OPENAI_API_KEY=".into(),
        "--env".into(),
        format!("FM_HOME={}", home.display()),
    ];
    let created = super::herdr::command(&args, Duration::from_secs(10))?;
    let tab = field(&created, &["result", "tab", "tab_id"])?.to_string();
    let pane = field(&created, &["result", "root_pane", "pane_id"])?.to_string();
    let name = format!(
        "pv_firstmate_{}",
        &uuid::Uuid::new_v4().simple().to_string()[..10]
    );
    let start = (|| {
        // A fresh tab can need a moment to reach its interactive shell.
        let deadline = std::time::Instant::now() + Duration::from_secs(30);
        loop {
            let info = super::herdr::command(
                &[
                    "pane".into(),
                    "process-info".into(),
                    "--pane".into(),
                    pane.clone(),
                ],
                Duration::from_secs(5),
            )?;
            let process = &info["result"]["process_info"];
            let shell = process["shell_pid"].as_u64();
            if process["foreground_processes"]
                .as_array()
                .is_some_and(|items| {
                    items.len() == 1 && items[0]["pid"].as_u64() == shell && shell.is_some()
                })
            {
                break;
            }
            if std::time::Instant::now() >= deadline {
                return Err("Firstmate pane did not become ready.".to_string());
            }
            std::thread::sleep(Duration::from_millis(200));
        }
        let started = super::herdr::command(
            &[
                "agent".into(),
                "start".into(),
                name.clone(),
                "--kind".into(),
                "pi".into(),
                "--pane".into(),
                pane.clone(),
                "--timeout".into(),
                "120000".into(),
                "--".into(),
                "--approve".into(),
                "--provider".into(),
                "openai-codex".into(),
                "--model".into(),
                settings.model.clone(),
                "--thinking".into(),
                settings.thinking.clone(),
            ],
            Duration::from_secs(125),
        )?;
        let log =
            field(&started, &["result", "agent", "agent_session", "value"]).map(PathBuf::from)?;
        // Pi may announce its session path before writing the first JSONL entry.
        // Do not require the file until the first prompt has produced output.
        if !log.is_absolute() || log.extension().is_none_or(|ext| ext != "jsonl") {
            return Err("Firstmate did not return a Pi session path.".into());
        }
        Ok(log)
    })();
    let log = match start {
        Ok(log) => log,
        Err(error) => {
            let _ =
                super::herdr::command(&["tab".into(), "close".into(), tab], Duration::from_secs(5));
            return Err(error);
        }
    };
    if !configured(app).is_ok_and(|current| {
        current.firstmate_path.as_deref() == Some(path)
            && current.model == settings.model
            && current.thinking == settings.thinking
    }) {
        let _ = super::herdr::command(&["tab".into(), "close".into(), tab], Duration::from_secs(5));
        return Err("Mayor settings changed while Firstmate was starting.".into());
    }
    let new_session = FirstmateSession {
        path: folder.to_string_lossy().into_owned(),
        tab: tab.clone(),
        pane: pane.clone(),
        agent: name.clone(),
        log: log.clone(),
        offset: fs::metadata(&log).map(|m| m.len()).unwrap_or(0),
        model: settings.model,
        thinking: settings.thinking,
        home: home.to_string_lossy().into_owned(),
    };
    if let Err(error) = persist(&new_session) {
        let _ = super::herdr::command(&["tab".into(), "close".into(), tab], Duration::from_secs(5));
        return Err(error);
    }
    *state.0.lock().unwrap_or_else(|e| e.into_inner()) = new_session;
    Ok((name, pane, log))
}

#[tauri::command]
pub async fn start_firstmate(app: AppHandle) -> Result<(), String> {
    let target = app.clone();
    let busy = tauri::async_runtime::spawn_blocking(move || {
        let (agent, _, _) = owned_session(&target)?;
        let info = super::herdr::command(
            &["agent".into(), "get".into(), agent],
            Duration::from_secs(5),
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
        let info = super::herdr::command(
            &["agent".into(), "get".into(), agent.clone()],
            Duration::from_secs(5),
        )?;
        if !matches!(
            info["result"]["agent"]["agent_status"].as_str(),
            Some("idle" | "done")
        ) {
            return Err(
                "Firstmate is busy. Wait for its reply before sending another request.".into(),
            );
        }
        super::herdr::command(
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
        let value = super::herdr::command(
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
    super::herdr::command(
        &["agent".into(), "send-keys".into(), agent, "esc".into()],
        Duration::from_secs(5),
    )
    .map(|_| ())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FirstmateReply {
    pub(crate) text: String,
    pub(crate) offset: u64,
}

/// Only completed assistant messages are eligible, never tools or terminal output.
/// The cursor advances only after the view acknowledges the displayed reply.
#[tauri::command]
pub fn poll_firstmate_replies(app: AppHandle) -> Result<Option<FirstmateReply>, String> {
    configured(&app)?;
    let state = app.state::<FirstmateState>();
    let mut session = state.0.lock().unwrap_or_else(|e| e.into_inner());
    if session.log.as_os_str().is_empty() {
        return Ok(None);
    }
    let mut file = match fs::File::open(&session.log) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound && session.offset == 0 => {
            return Ok(None)
        }
        Err(_) => return Err("Firstmate session log unavailable.".into()),
    };
    let len = file
        .metadata()
        .map_err(|_| "Could not inspect Firstmate log.".to_string())?
        .len();
    if len < session.offset {
        session.offset = 0;
    }
    file.seek(SeekFrom::Start(session.offset))
        .map_err(|_| "Could not read Firstmate log.".to_string())?;
    let mut reader = BufReader::new(file);
    loop {
        let start = reader
            .stream_position()
            .map_err(|_| "Could not read Firstmate log.".to_string())?;
        let mut bytes = Vec::new();
        let read = (&mut reader)
            .take(256_001)
            .read_until(b'\n', &mut bytes)
            .map_err(|_| "Could not read Firstmate log.".to_string())?;
        if read == 0 {
            break;
        }
        if !bytes.ends_with(b"\n") {
            if read <= 256_000 {
                break;
            } // Incomplete record: retry after the writer finishes.
              // Skip oversized records without allocating their entire tool payload.
            loop {
                let mut chunk = Vec::new();
                let n = (&mut reader)
                    .take(8_192)
                    .read_until(b'\n', &mut chunk)
                    .map_err(|_| "Could not skip oversized Firstmate record.".to_string())?;
                if n == 0 || chunk.ends_with(b"\n") {
                    break;
                }
            }
            session.offset = reader.stream_position().unwrap_or(start);
            persist(&session)?;
            continue;
        }
        let end = reader.stream_position().unwrap_or(start);
        let Ok(line) = std::str::from_utf8(&bytes) else {
            session.offset = end;
            persist(&session)?;
            continue;
        };
        if let Ok(value) = serde_json::from_str::<Value>(line) {
            let message = &value["message"];
            if value["type"] == "message"
                && message["role"] == "assistant"
                && message["stopReason"] == "error"
            {
                session.offset = end;
                persist(&session)?;
                return Err(
                    "Firstmate could not complete its reply. Check the agent and retry.".into(),
                );
            }
            if value["type"] == "message"
                && message["role"] == "assistant"
                && message["stopReason"] == "stop"
            {
                let text = message["content"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .filter(|part| part["type"] == "text")
                    .filter_map(|part| part["text"].as_str())
                    .collect::<Vec<_>>()
                    .join("\n");
                if !text.trim().is_empty() {
                    return Ok(Some(FirstmateReply {
                        text: text.trim().chars().take(6000).collect(),
                        offset: end,
                    }));
                }
            }
        }
        session.offset = end;
        persist(&session)?;
    }
    Ok(None)
}

#[tauri::command]
pub fn acknowledge_firstmate_reply(offset: u64, app: AppHandle) -> Result<(), String> {
    configured(&app)?;
    let state = app.state::<FirstmateState>();
    let mut session = state.0.lock().unwrap_or_else(|e| e.into_inner());
    if session.log.as_os_str().is_empty() {
        return Err("Firstmate session ended.".into());
    }
    let length = fs::metadata(&session.log)
        .map_err(|_| "Firstmate session log unavailable.".to_string())?
        .len();
    if offset < session.offset || offset > length {
        return Err("Firstmate reply changed before it could be acknowledged.".into());
    }
    session.offset = offset;
    persist(&session)
}

#[tauri::command]
pub fn latest_firstmate_reply(app: AppHandle) -> Result<Option<String>, String> {
    configured(&app)?;
    let log = app
        .state::<FirstmateState>()
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .log
        .clone();
    if log.as_os_str().is_empty() {
        return Ok(None);
    }
    let mut file = fs::File::open(log).map_err(|_| "Firstmate session log unavailable.")?;
    let length = file
        .metadata()
        .map_err(|_| "Could not inspect Firstmate log.")?
        .len();
    file.seek(SeekFrom::Start(length.saturating_sub(512_000)))
        .map_err(|_| "Could not read Firstmate log.")?;
    let mut bytes = Vec::new();
    file.take(512_000)
        .read_to_end(&mut bytes)
        .map_err(|_| "Could not read Firstmate log.")?;
    for line in bytes.split(|byte| *byte == b'\n').rev() {
        let Ok(value) = serde_json::from_slice::<Value>(line) else {
            continue;
        };
        let message = &value["message"];
        if value["type"] != "message"
            || message["role"] != "assistant"
            || message["stopReason"] != "stop"
        {
            continue;
        }
        let text = message["content"]
            .as_array()
            .into_iter()
            .flatten()
            .filter(|part| part["type"] == "text")
            .filter_map(|part| part["text"].as_str())
            .collect::<Vec<_>>()
            .join("\n");
        if !text.trim().is_empty() {
            return Ok(Some(text.trim().chars().take(6000).collect()));
        }
    }
    Ok(None)
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
        let info = super::herdr::command(
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
        if super::herdr::command(
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

fn key() -> Result<String, String> {
    super::openai::api_key().ok_or_else(|| "Add an OpenAI API key in Mayor settings.".into())
}

#[tauri::command]
pub async fn transcribe_firstmate_audio(
    audio: String,
    mime: String,
    app: AppHandle,
) -> Result<String, String> {
    configured(&app)?;
    let (filename, content_type) = if mime.starts_with("audio/webm") {
        ("speech.webm", "audio/webm")
    } else if mime.starts_with("audio/mp4") {
        ("speech.mp4", "audio/mp4")
    } else if mime.starts_with("audio/wav") {
        ("speech.wav", "audio/wav")
    } else {
        return Err("This microphone recording format is not supported.".into());
    };
    if audio.len() > 20_000_000 {
        return Err("Recording is too long. Try a shorter request.".into());
    }
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(audio)
        .map_err(|_| "Invalid microphone recording.".to_string())?;
    if bytes.is_empty() || bytes.len() > 15_000_000 {
        return Err("Recording is empty or too long.".into());
    }
    let boundary = format!("pet-town-{}", uuid::Uuid::new_v4().simple());
    let mut body = format!("--{boundary}\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\ngpt-transcribe\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n").into_bytes();
    body.extend(bytes);
    body.extend(format!("\r\n--{boundary}--\r\n").as_bytes());
    let response = reqwest::Client::new()
        .post("https://api.openai.com/v1/audio/transcriptions")
        .bearer_auth(key()?)
        .header(
            "Content-Type",
            format!("multipart/form-data; boundary={boundary}"),
        )
        .timeout(Duration::from_secs(60))
        .body(body)
        .send()
        .await
        .map_err(|_| "Speech transcription failed. Check your connection and retry.".to_string())?;
    if !response.status().is_success() {
        return Err(format!(
            "Speech transcription failed (HTTP {}).",
            response.status().as_u16()
        ));
    }
    let value: Value = response
        .json()
        .await
        .map_err(|_| "Invalid transcription reply.".to_string())?;
    value["text"]
        .as_str()
        .filter(|s| !s.trim().is_empty())
        .map(str::to_string)
        .ok_or_else(|| "No speech was recognized.".into())
}

#[tauri::command]
pub async fn speak_firstmate_text(text: String, app: AppHandle) -> Result<String, String> {
    configured(&app)?;
    if text.trim().is_empty() || text.chars().count() > 6000 {
        return Err("Reply is too long to speak.".into());
    }
    let client = reqwest::Client::new();
    let api_key = key()?;
    for attempt in 0..2 {
        let response = client.post("https://api.openai.com/v1/audio/speech")
            .bearer_auth(&api_key).json(&serde_json::json!({"model":"gpt-4o-mini-tts","voice":"alloy","input":text,"response_format":"mp3"}))
            .timeout(Duration::from_secs(90)).send().await;
        let response = match response {
            Ok(response) => response,
            Err(error) => {
                eprintln!("[mayor speech] request failed: {error}");
                if attempt == 0 {
                    continue;
                }
                return Err("Could not generate spoken reply.".into());
            }
        };
        if !response.status().is_success() {
            return Err(format!(
                "Spoken reply failed (HTTP {}).",
                response.status().as_u16()
            ));
        }
        match response.bytes().await {
            Ok(bytes) => {
                if bytes.len() > 12_000_000 {
                    return Err("Spoken reply is too large.".into());
                }
                return Ok(base64::engine::general_purpose::STANDARD.encode(bytes));
            }
            Err(error) => {
                eprintln!("[mayor speech] audio download failed: {error}");
                if attempt == 0 {
                    continue;
                }
            }
        }
    }
    Err("Could not read spoken reply.".into())
}
