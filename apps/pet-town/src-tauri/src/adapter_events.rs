mod enabled;
mod focus_hint;
mod herdr_host;
mod ingestion;
mod lifecycle;
mod registry;
mod relay;

use crate::agents::safe_display_label;
pub use ingestion::record as record_from_stdin;
pub use relay::relay as relay_from_stdin;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

const EVENT_INPUT_LIMIT: u64 = 64 * 1024;
const RECORD_VERSION: u8 = 1;
const MAX_RECORD_AGE_SECONDS: u64 = 24 * 60 * 60;
const SOURCES: [&str; 6] = ["claude", "codex", "opencode", "pi", "factory", "cursor"];

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct AdapterEventRecord {
    pub(crate) version: u8,
    pub(crate) source: String,
    pub(crate) session_key: String,
    pub(crate) state: String,
    pub(crate) label: String,
    pub(crate) observed_at_seconds: u64,
    pub(crate) hosted_owner_key: Option<String>,
    pub(crate) focus_app: Option<String>,
}

pub(crate) fn current_time_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}

fn registry_directory() -> Result<PathBuf, String> {
    let home =
        std::env::var_os("HOME").ok_or_else(|| "home directory is unavailable".to_string())?;
    Ok(PathBuf::from(home).join(".pet-town").join("agent-sessions"))
}

pub(crate) fn opaque_key(value: &str) -> String {
    let mut hash = 0xcbf29ce484222325_u64;
    for byte in value.as_bytes() {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{hash:016x}")
}

fn source_allowed(source: &str) -> bool {
    SOURCES.contains(&source)
}

fn payload_string<'a>(payload: &'a Value, names: &[&str]) -> Option<&'a str> {
    names
        .iter()
        .find_map(|name| payload.get(*name).and_then(Value::as_str))
        .map(str::trim)
        .filter(|value| !value.is_empty())
}

fn safe_label(payload: &Value, source: &str, session_key: &str) -> String {
    let path = payload_string(payload, &["cwd", "working_directory", "workspace"]).or_else(|| {
        payload
            .get("workspace_roots")
            .and_then(Value::as_array)
            .and_then(|roots| roots.first())
            .and_then(Value::as_str)
    });
    let from_path = path
        .and_then(|value| Path::new(value).file_name())
        .and_then(|value| value.to_str());
    safe_display_label(from_path)
        .unwrap_or_else(|| format!("{source}-{}", &session_key[..8.min(session_key.len())]))
}

pub(crate) fn source_epoch(source: &str) -> Option<String> {
    enabled::epoch(source)
}

pub(crate) fn source_disabled(source: &str) -> bool {
    enabled::is_disabled(source)
}

pub(crate) fn restore_source_state(
    source: &str,
    epoch: Option<&str>,
    was_disabled: bool,
) -> Result<(), String> {
    registry::with_lock(|| enabled::restore_state(source, epoch, was_disabled))
}

pub(crate) fn set_source_enabled(source: &str, is_enabled: bool) -> Result<(), String> {
    registry::with_lock(|| {
        let previous_epoch = enabled::epoch(source);
        let was_disabled = enabled::is_disabled(source);
        if let Err(error) = enabled::set(source, is_enabled) {
            return match enabled::restore_state(source, previous_epoch.as_deref(), was_disabled) {
                Ok(()) => Err(error),
                Err(rollback) => Err(format!("{error}; rollback failed: {rollback}")),
            };
        }
        Ok(())
    })
}

pub(crate) fn purge_source_records(source: &str) -> Result<(), String> {
    registry::with_lock(|| {
        registry::remove_source_records(source);
        Ok(())
    })
}

fn record_path(directory: &Path, source: &str, session_key: &str) -> PathBuf {
    directory.join(format!("{source}-{session_key}.json"))
}

fn write_private_atomic(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let temporary = path.with_extension(format!("tmp-{}-{stamp}", std::process::id()));
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temporary)
        .map_err(|_| "could not create adapter event".to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        file.set_permissions(fs::Permissions::from_mode(0o600))
            .map_err(|_| "could not secure adapter event".to_string())?;
    }
    file.write_all(bytes)
        .map_err(|_| "could not write adapter event".to_string())?;
    file.sync_all()
        .map_err(|_| "could not flush adapter event".to_string())?;
    fs::rename(&temporary, path).map_err(|_| {
        let _ = fs::remove_file(&temporary);
        "could not publish adapter event".to_string()
    })
}
