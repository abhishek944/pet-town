use serde_json::{Map, Value};
use std::io::{self, Read, Write};
use std::process::{Command, Stdio};

pub fn relay(source: &str, event: &str, install_epoch: Option<&str>) -> Result<(), String> {
    if !super::source_allowed(source) {
        return Err("unsupported adapter source".to_string());
    }
    let mut input = String::new();
    io::stdin()
        .take(super::EVENT_INPUT_LIMIT + 1)
        .read_to_string(&mut input)
        .map_err(|_| "could not read adapter event".to_string())?;
    if input.len() as u64 > super::EVENT_INPUT_LIMIT {
        return Err("adapter event is too large".to_string());
    }
    let payload: Value =
        serde_json::from_str(&input).map_err(|_| "adapter event must be valid JSON".to_string())?;
    let session = super::payload_string(
        &payload,
        &[
            "session_id",
            "sessionId",
            "conversation_id",
            "conversationId",
            "thread_id",
            "threadId",
        ],
    )
    .ok_or_else(|| "adapter event has no session identifier".to_string())?;
    let mut safe = Map::new();
    safe.insert("session_id".to_string(), Value::String(session.to_string()));
    let label = super::safe_label(&payload, source, &super::opaque_key(session));
    safe.insert("cwd".to_string(), Value::String(label));
    for name in ["notification_type", "type", "matcher"] {
        if let Some(value) = super::payload_string(&payload, &[name]) {
            safe.insert(name.to_string(), Value::String(value.to_string()));
        }
    }
    let bytes = serde_json::to_vec(&Value::Object(safe))
        .map_err(|_| "could not sanitize adapter event".to_string())?;
    let binary = std::env::current_exe()
        .map_err(|_| "could not locate the installed application".to_string())?;
    let generation =
        std::env::var("PET_TOWN_HOOK_GENERATION").unwrap_or_else(|_| super::opaque_key(session));
    let epoch = install_epoch
        .map(str::to_string)
        .or_else(|| super::enabled::epoch(source));
    let mut command = Command::new(binary);
    command
        .env_remove("OPENAI_API_KEY")
        .args(["--adapter-event", source, event])
        .env("PET_TOWN_HOOK_GENERATION", generation);
    if let Some(epoch) = epoch {
        command.env("PET_TOWN_ADAPTER_EPOCH", epoch);
    }
    let mut child = command
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|_| "could not start adapter event worker".to_string())?;
    child
        .stdin
        .take()
        .ok_or_else(|| "adapter event worker has no input".to_string())?
        .write_all(&bytes)
        .map_err(|_| "could not forward adapter event".to_string())?;
    let boundary = matches!(
        event.to_ascii_lowercase().as_str(),
        "sessionstart" | "session_start" | "sessionend" | "session_end"
    );
    if boundary {
        child
            .wait()
            .map_err(|_| "adapter event worker did not finish".to_string())?;
    }
    Ok(())
}
