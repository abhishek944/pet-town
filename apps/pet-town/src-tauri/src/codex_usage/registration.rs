use super::{inbox, model::Session, storage};
use serde_json::Value;
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Read, Seek, SeekFrom};
use std::path::{Component, Path, PathBuf};

pub(super) fn safe_model(value: &str) -> Option<String> {
    (value
        .as_bytes()
        .first()
        .is_some_and(u8::is_ascii_alphabetic)
        && !valid_session(value)
        && value.len() <= 128
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"-._:/".contains(&byte)))
    .then(|| value.to_string())
}

pub(super) fn valid_session(value: &str) -> bool {
    value.len() == 36
        && value.bytes().enumerate().all(|(index, byte)| {
            if [8, 13, 18, 23].contains(&index) {
                byte == b'-'
            } else {
                byte.is_ascii_hexdigit()
            }
        })
}

pub(super) fn validated_path(path: &Path) -> Option<PathBuf> {
    validated_path_in(path, &configured_root()?)
}

pub(super) fn configured_root() -> Option<PathBuf> {
    std::env::var_os("CODEX_HOME")
        .map(PathBuf::from)
        .or_else(|| Some(PathBuf::from(std::env::var_os("HOME")?).join(".codex")))
}

pub(super) fn validated_path_in(path: &Path, home: &Path) -> Option<PathBuf> {
    if !path.is_absolute()
        || path
            .components()
            .any(|part| matches!(part, Component::ParentDir))
    {
        return None;
    }
    if !home.is_absolute() {
        return None;
    }
    let suffix = path.strip_prefix(home).ok()?;
    let mut parts = suffix.components();
    let first = parts.next()?.as_os_str();
    if first != "sessions" && first != "archived_sessions" {
        return None;
    }
    let mut current = home.to_path_buf();
    for part in suffix.components() {
        if !matches!(part, Component::Normal(_)) {
            return None;
        }
        current.push(part);
        if fs::symlink_metadata(&current)
            .ok()?
            .file_type()
            .is_symlink()
        {
            return None;
        }
    }
    let canonical = fs::canonicalize(path).ok()?;
    let root = fs::canonicalize(home).ok()?;
    if !canonical.starts_with(root) || path.extension()?.to_str()? != "jsonl" {
        return None;
    }
    Some(canonical)
}

pub(super) const HEADER_LIMIT: usize = 1024 * 1024;

pub(super) fn header(file: &mut File, session: &str) -> Option<bool> {
    let mut bytes = Vec::new();
    file.seek(SeekFrom::Start(0)).ok()?;
    BufReader::new(file.take(HEADER_LIMIT as u64))
        .read_until(b'\n', &mut bytes)
        .ok()?;
    if bytes.last() != Some(&b'\n') {
        return None;
    }
    let record: Value = serde_json::from_slice(&bytes).ok()?;
    let matching = record["type"] == "session_meta"
        && record["payload"]["id"]
            .as_str()
            .is_some_and(|id| id.eq_ignore_ascii_case(session));
    matching.then(|| {
        [
            "forked_from_id",
            "forked_from_ordinal_exclusive",
            "history_base",
            "subagent_history_start_ordinal",
        ]
        .iter()
        .any(|key| !record["payload"][key].is_null())
    })
}

pub(crate) fn register(session_id: &str, agent_id: &str, owner: Option<&str>, payload: &Value) {
    if !valid_session(session_id) {
        return;
    }
    let Some(path) = payload
        .get("transcript_path")
        .and_then(Value::as_str)
        .and_then(|path| validated_path(Path::new(path)))
    else {
        return;
    };
    let Some(mut file) = storage::private_open(&path) else {
        return;
    };
    let Some(inherited_history) = header(&mut file, session_id) else {
        return;
    };
    let Some(directory) = storage::secure_directory() else {
        return;
    };
    let mut session = Session {
        version: 1,
        session_id: session_id.to_ascii_lowercase(),
        path: path.clone(),
        transcript_root: None,
        agents: Vec::new(),
        model: None,
        hook_model: None,
        offset: 0,
        scan_offset: 0,
        file_identity: None,
        tokens: None,
        counter_epoch: 0,
        models: BTreeMap::new(),
        updated_at_seconds: 0,
        estimate_incomplete: false,
        partial: false,
        measurement_incomplete: false,
        inherited_history,
    };
    session.path = path;
    session.transcript_root = configured_root().and_then(|root| fs::canonicalize(root).ok());
    if let Some(model) = payload
        .get("model")
        .and_then(Value::as_str)
        .and_then(safe_model)
    {
        // This describes the current hook, never historical price attribution.
        session.hook_model = Some(model);
    }
    let hosted = owner
        .and_then(|key| key.strip_prefix("herdr-session:"))
        .map(|suffix| format!("herdr:{suffix}"));
    for alias in std::iter::once(agent_id.to_string()).chain(hosted) {
        if !session.agents.contains(&alias) {
            session.agents.push(alias);
        }
    }
    if session.agents.len() > 16 {
        session.agents.drain(..session.agents.len() - 16);
    }
    // Queue metadata without the replay lock; refresh merges existing counters.
    let _ = inbox::enqueue(&directory, &session);
}
