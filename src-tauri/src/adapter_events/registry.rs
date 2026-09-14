use super::{
    current_time_seconds, source_allowed, AdapterEventRecord, EVENT_INPUT_LIMIT,
    MAX_RECORD_AGE_SECONDS, RECORD_VERSION,
};
use fs2::FileExt;
use std::fs::{self, OpenOptions};
#[cfg(unix)]
use std::os::unix::fs::{OpenOptionsExt, PermissionsExt};
use std::path::PathBuf;
use std::time::UNIX_EPOCH;

pub(super) fn with_lock<T>(action: impl FnOnce() -> Result<T, String>) -> Result<T, String> {
    let directory = super::registry_directory()?;
    fs::create_dir_all(&directory).map_err(|_| "could not create adapter registry".to_string())?;
    #[cfg(unix)]
    fs::set_permissions(&directory, fs::Permissions::from_mode(0o700))
        .map_err(|_| "could not secure adapter registry".to_string())?;
    let mut options = OpenOptions::new();
    options.read(true).write(true).create(true);
    #[cfg(unix)]
    options.custom_flags(libc::O_NOFOLLOW);
    let lock = options
        .open(directory.join(".registry-lock"))
        .map_err(|_| "could not open adapter registry lock".to_string())?;
    #[cfg(unix)]
    lock.set_permissions(fs::Permissions::from_mode(0o600))
        .map_err(|_| "could not secure adapter registry lock".to_string())?;
    lock.lock_exclusive()
        .map_err(|_| "could not lock adapter registry".to_string())?;
    let result = action();
    let _ = lock.unlock();
    result
}

fn collect_records() -> Vec<(PathBuf, AdapterEventRecord)> {
    let Ok(directory) = super::registry_directory() else {
        return Vec::new();
    };
    let Ok(entries) = fs::read_dir(directory) else {
        return Vec::new();
    };
    let now = current_time_seconds();
    let mut records = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        let extension = path.extension().and_then(|value| value.to_str());
        if extension == Some("ended") {
            let modified = entry
                .metadata()
                .ok()
                .and_then(|metadata| metadata.modified().ok())
                .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
                .map(|duration| duration.as_secs())
                .unwrap_or(0);
            if now.saturating_sub(modified) > MAX_RECORD_AGE_SECONDS {
                let _ = fs::remove_file(path);
            }
            continue;
        }
        if extension.is_some_and(|value| value.starts_with("tmp-")) {
            let stale = entry
                .metadata()
                .ok()
                .and_then(|metadata| metadata.modified().ok())
                .and_then(|time| time.elapsed().ok())
                .is_some_and(|age| age.as_secs() > 60 * 60);
            if stale {
                let _ = fs::remove_file(path);
            }
            continue;
        }
        if extension != Some("json") {
            continue;
        }
        let Some(record) = fs::read(&path)
            .ok()
            .filter(|bytes| bytes.len() <= EVENT_INPUT_LIMIT as usize)
            .and_then(|bytes| serde_json::from_slice::<AdapterEventRecord>(&bytes).ok())
        else {
            let _ = fs::remove_file(path);
            continue;
        };
        if record.version != RECORD_VERSION
            || !source_allowed(&record.source)
            || now.saturating_sub(record.observed_at_seconds) > MAX_RECORD_AGE_SECONDS
        {
            let _ = fs::remove_file(path);
            continue;
        }
        records.push((path, record));
    }
    records.sort_by(|left, right| {
        right
            .1
            .observed_at_seconds
            .cmp(&left.1.observed_at_seconds)
            .then_with(|| left.1.session_key.cmp(&right.1.session_key))
    });
    records
}

pub(crate) fn prune_records() {
    let _ = collect_records();
}

pub(crate) fn remove_source_records(source: &str) {
    let Ok(directory) = super::registry_directory() else {
        return;
    };
    let Ok(entries) = fs::read_dir(directory) else {
        return;
    };
    let prefix = format!("{source}-");
    for entry in entries.flatten() {
        let path = entry.path();
        if path
            .file_name()
            .and_then(|value| value.to_str())
            .is_some_and(|name| name.starts_with(&prefix))
        {
            let _ = fs::remove_file(path);
        }
    }
}

pub(crate) fn read_records() -> Vec<AdapterEventRecord> {
    with_lock(|| {
        let mut records: Vec<_> = collect_records()
            .into_iter()
            .map(|(_, record)| record)
            .filter(|record| !super::enabled::is_disabled(&record.source))
            .collect();
        records.sort_by(|left, right| left.session_key.cmp(&right.session_key));
        Ok(records)
    })
    .unwrap_or_default()
}
