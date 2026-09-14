use serde_json::Value;
use std::fs;
use std::io::{self, Read};

pub fn record(source: &str, event: &str, install_epoch: Option<&str>) -> Result<(), String> {
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
    let session_id = super::payload_string(
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
    .map(str::to_string)
    .ok_or_else(|| "adapter event has no session identifier".to_string())?;
    let generation = std::env::var("PET_VILLAGE_HOOK_GENERATION")
        .ok()
        .or_else(|| {
            super::payload_string(&payload, &["_agent_pets_generation"]).map(str::to_string)
        })
        .unwrap_or_else(|| "legacy".to_string());
    let session_key = super::opaque_key(&format!("{source}:{session_id}:{generation}"));
    let received_epoch = install_epoch
        .map(str::to_string)
        .or_else(|| std::env::var("PET_VILLAGE_ADAPTER_EPOCH").ok());
    super::registry::with_lock(|| {
        publish(
            source,
            event,
            received_epoch.as_deref(),
            &session_id,
            session_key,
            payload,
        )
    })
}

fn publish(
    source: &str,
    event: &str,
    install_epoch: Option<&str>,
    session_id: &str,
    session_key: String,
    payload: Value,
) -> Result<(), String> {
    if super::enabled::is_disabled(source) {
        return Ok(());
    }
    if let Some(expected) = super::enabled::epoch(source) {
        match install_epoch {
            Some(received) if expected == received => {}
            None if std::env::var("PET_VILLAGE_ALLOW_UNVERSIONED")
                .ok()
                .as_deref()
                == Some("1") => {}
            _ => return Ok(()),
        }
    }
    let directory = super::registry_directory()?;
    let path = super::record_path(&directory, source, &session_key);
    fs::create_dir_all(&directory).map_err(|_| "could not create adapter registry".to_string())?;
    let tombstone = path.with_extension("ended");
    let Some(state) = super::lifecycle::state(source, event, &payload) else {
        super::write_private_atomic(&tombstone, b"ended")?;
        let _ = fs::remove_file(path);
        super::registry::prune_records();
        return Ok(());
    };
    if event.eq_ignore_ascii_case("sessionstart") || event.eq_ignore_ascii_case("session_start") {
        let _ = fs::remove_file(&tombstone);
    } else if tombstone.exists() {
        return Ok(());
    }
    let record = super::AdapterEventRecord {
        version: super::RECORD_VERSION,
        source: source.to_string(),
        session_key,
        state: state.to_string(),
        label: super::safe_label(&payload, source, &super::opaque_key(session_id)),
        observed_at_seconds: super::current_time_seconds(),
        hosted_owner_key: super::herdr_host::owner_key(session_id),
        focus_app: super::focus_hint::focus_application(source),
    };
    let bytes =
        serde_json::to_vec(&record).map_err(|_| "could not encode adapter event".to_string())?;
    super::write_private_atomic(&path, &bytes)?;
    if tombstone.exists() {
        let _ = fs::remove_file(&path);
    }
    super::registry::prune_records();
    Ok(())
}
