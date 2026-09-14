mod atomic;
mod locking;

pub(super) use atomic::{remove_conditionally, write_atomic, write_private_backup};
pub(super) use locking::with_file_lock;
use serde_json::{Map, Value};
use std::fs::{self, File, OpenOptions};
use std::io::{ErrorKind, Read};
#[cfg(unix)]
use std::os::unix::fs::OpenOptionsExt;
use std::path::{Path, PathBuf};

pub(super) const MANAGED_MARKER: &str = "--agent-pets-managed";
pub(super) const FILE_MARKER: &str = "agent-pets-managed";
const MAX_SETTINGS_BYTES: u64 = 1024 * 1024;

fn home_directory() -> Result<PathBuf, String> {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .ok_or_else(|| "home directory is unavailable".to_string())
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\"'\"'"))
}

pub(super) fn hook_command(source: &str, event: &str) -> Result<String, String> {
    let binary = std::env::current_exe()
        .map_err(|_| "could not locate the installed application".to_string())?;
    let epoch = crate::adapter_events::source_epoch(source)
        .ok_or_else(|| "adapter installation identity is unavailable".to_string())?;
    Ok(format!(
        "{} --adapter-relay {} {} {} {}",
        shell_quote(&binary.to_string_lossy()),
        source,
        event,
        MANAGED_MARKER,
        epoch
    ))
}

pub(super) fn settings_path(source: &str) -> Result<PathBuf, String> {
    let home = home_directory()?;
    match source {
        "claude" => Ok(home.join(".claude/settings.json")),
        "codex" => Ok(home.join(".codex/config.toml")),
        "opencode" => Ok(home.join(".config/opencode/plugins/agent-pets.js")),
        "pi" => Ok(home.join(".pi/agent/extensions/agent-pets.ts")),
        "factory" => Ok(home.join(".factory/hooks.json")),
        "cursor" => Ok(home.join(".cursor/hooks.json")),
        _ => Err("unsupported adapter".to_string()),
    }
}

pub(super) fn read_regular_file(path: &Path, label: &str) -> Result<Option<Vec<u8>>, String> {
    let mut options = OpenOptions::new();
    options.read(true);
    #[cfg(unix)]
    options.custom_flags(libc::O_NOFOLLOW);
    let mut file = match options.open(path) {
        Ok(file) => file,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
        Err(_) => return Err(format!("{label} must be a readable regular file")),
    };
    let metadata = file
        .metadata()
        .map_err(|_| format!("could not inspect {label}"))?;
    if !metadata.is_file() || metadata.len() > MAX_SETTINGS_BYTES {
        return Err(format!("{label} is not a safely sized regular file"));
    }
    let mut bytes = Vec::with_capacity(metadata.len() as usize);
    file.read_to_end(&mut bytes)
        .map_err(|_| format!("could not read {label}"))?;
    Ok(Some(bytes))
}

pub(super) fn read_json_with_original(
    path: &Path,
    label: &str,
) -> Result<(Map<String, Value>, Option<Vec<u8>>), String> {
    let original = read_regular_file(path, label)?;
    let Some(bytes) = original.as_deref() else {
        return Ok((Map::new(), None));
    };
    let value: Value =
        serde_json::from_slice(bytes).map_err(|_| format!("{label} is not valid JSON"))?;
    let settings = value
        .as_object()
        .cloned()
        .ok_or_else(|| format!("{label} must contain a JSON object"))?;
    Ok((settings, original))
}

pub(super) fn read_json(path: &Path, label: &str) -> Result<Map<String, Value>, String> {
    read_json_with_original(path, label).map(|(settings, _)| settings)
}

#[cfg(unix)]
pub(super) fn make_private(file: &File) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    file.set_permissions(fs::Permissions::from_mode(0o600))
        .map_err(|_| "could not secure adapter settings".to_string())
}

#[cfg(not(unix))]
pub(super) fn make_private(_file: &File) -> Result<(), String> {
    Ok(())
}

pub(super) fn write_json(
    path: &Path,
    settings: &Map<String, Value>,
    expected: Option<&[u8]>,
    label: &str,
) -> Result<(), String> {
    let mut bytes = serde_json::to_vec_pretty(&Value::Object(settings.clone()))
        .map_err(|_| format!("could not encode {label}"))?;
    bytes.push(b'\n');
    write_atomic(path, &bytes, expected, label)
}

pub(super) fn is_managed_hook_entry(value: &Value) -> bool {
    match value {
        Value::Array(items) => items.iter().any(is_managed_hook_entry),
        Value::Object(items) => {
            let marked_command = items
                .get("command")
                .and_then(Value::as_str)
                .is_some_and(|text| {
                    text.split_ascii_whitespace()
                        .any(|word| word.trim_matches(['\'', '"']) == MANAGED_MARKER)
                });
            marked_command || items.get("hooks").is_some_and(is_managed_hook_entry)
        }
        _ => false,
    }
}
