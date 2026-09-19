use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

fn state_path(source: &str, directory: &str) -> Result<PathBuf, String> {
    if !super::source_allowed(source) || source == "herdr" {
        return Err("unsupported adapter source".to_string());
    }
    Ok(super::registry_directory()?
        .parent()
        .ok_or_else(|| "adapter state directory is unavailable".to_string())?
        .join(directory)
        .join(source))
}

fn marker(source: &str) -> Result<PathBuf, String> {
    state_path(source, "disabled-adapters")
}

pub(super) fn epoch(source: &str) -> Option<String> {
    fs::read_to_string(state_path(source, "adapter-epochs").ok()?).ok()
}

fn remove_marker(marker: PathBuf) -> Result<(), String> {
    match fs::remove_file(marker) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(_) => Err("could not enable adapter events".to_string()),
    }
}

pub(super) fn restore_state(
    source: &str,
    previous_epoch: Option<&str>,
    was_disabled: bool,
) -> Result<(), String> {
    let epoch_path = state_path(source, "adapter-epochs")?;
    if let Some(epoch) = previous_epoch {
        fs::create_dir_all(
            epoch_path
                .parent()
                .ok_or_else(|| "adapter state directory is unavailable".to_string())?,
        )
        .map_err(|_| "could not create adapter state".to_string())?;
        super::write_private_atomic(&epoch_path, epoch.as_bytes())?;
    } else if let Err(error) = fs::remove_file(&epoch_path) {
        if error.kind() != std::io::ErrorKind::NotFound {
            return Err("could not restore adapter state".to_string());
        }
    }
    let disabled_marker = marker(source)?;
    if !was_disabled {
        return remove_marker(disabled_marker);
    }
    fs::create_dir_all(
        disabled_marker
            .parent()
            .ok_or_else(|| "adapter state directory is unavailable".to_string())?,
    )
    .map_err(|_| "could not create adapter state".to_string())?;
    super::write_private_atomic(&disabled_marker, b"disabled")
}

pub(super) fn set(source: &str, enabled: bool) -> Result<(), String> {
    let marker = marker(source)?;
    if enabled {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|value| value.as_nanos())
            .unwrap_or(0);
        let epoch = format!("{}-{nanos}", std::process::id());
        let epoch_path = state_path(source, "adapter-epochs")?;
        fs::create_dir_all(
            epoch_path
                .parent()
                .ok_or_else(|| "adapter state directory is unavailable".to_string())?,
        )
        .map_err(|_| "could not create adapter state".to_string())?;
        super::write_private_atomic(&epoch_path, epoch.as_bytes())?;
        return remove_marker(marker);
    }
    let parent = marker
        .parent()
        .ok_or_else(|| "adapter state directory is unavailable".to_string())?;
    fs::create_dir_all(parent).map_err(|_| "could not create adapter state".to_string())?;
    super::write_private_atomic(&marker, b"disabled")
}

pub(super) fn is_disabled(source: &str) -> bool {
    marker(source).is_ok_and(|path| path.is_file())
}
