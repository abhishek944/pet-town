use crate::preferences_model::{PetPreferences, PreferencesFile, SCHEMA_VERSION};
use crate::preferences_permissions::{restrict_directory, restrict_file};
use serde_json::Value;
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
pub enum SaveOutcome {
    Durable,
    CommittedWithWarning(String),
}
pub enum ReadResult {
    Missing,
    Valid(PreferencesFile),
    Future(u64),
    Invalid(String),
}
pub fn preferences_path() -> Result<PathBuf, String> {
    let home = std::env::var_os("HOME").ok_or_else(|| "HOME is unavailable".to_string())?;
    Ok(PathBuf::from(home)
        .join(".pet-village")
        .join("preferences.json"))
}
pub fn read(path: &Path, ids: &[String]) -> ReadResult {
    let text = match fs::read_to_string(path) {
        Ok(text) => text,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return ReadResult::Missing,
        Err(error) => return ReadResult::Invalid(format!("could not read preferences: {error}")),
    };
    let value: Value = match serde_json::from_str(&text) {
        Ok(value) => value,
        Err(error) => {
            return ReadResult::Invalid(format!("preferences contain invalid JSON: {error}"))
        }
    };
    let Some(version) = value.get("schemaVersion").and_then(Value::as_u64) else {
        return ReadResult::Invalid("preferences are missing schemaVersion".to_string());
    };
    if version > u64::from(SCHEMA_VERSION) {
        return ReadResult::Future(version);
    }
    if version < u64::from(SCHEMA_VERSION) {
        return ReadResult::Invalid(format!(
            "schema version {version} belongs to the replaced product identity"
        ));
    }
    let preferences: PreferencesFile = match serde_json::from_value(value) {
        Ok(mut preferences) => {
            reconcile_user_pets(&mut preferences, ids);
            preferences
        }
        Err(error) => {
            return ReadResult::Invalid(format!("preferences have an invalid shape: {error}"))
        }
    };
    match preferences.validate(ids) {
        Ok(()) => ReadResult::Valid(preferences),
        Err(error) => ReadResult::Invalid(error),
    }
}
fn reconcile_user_pets(preferences: &mut PreferencesFile, ids: &[String]) {
    preferences
        .pets
        .retain(|id, _| ids.contains(id) || !id.starts_with("user-"));
    for id in ids.iter().filter(|id| id.starts_with("user-")) {
        preferences
            .pets
            .entry(id.clone())
            .or_insert_with(PetPreferences::default);
    }
    if preferences
        .app
        .orchestrator
        .pet_id
        .as_ref()
        .is_some_and(|id| !preferences.pets.contains_key(id))
    {
        preferences.app.orchestrator.pet_id = None;
    }
    if !preferences
        .pets
        .contains_key(&preferences.app.last_selected_pet_id)
    {
        preferences.app.last_selected_pet_id =
            PreferencesFile::defaults(ids).app.last_selected_pet_id;
    }
    if !preferences
        .pets
        .values()
        .any(|pet| pet.included_in_random_cast)
    {
        if let Some(id) = ids.iter().find(|id| !id.starts_with("user-")) {
            if let Some(pet) = preferences.pets.get_mut(id) {
                pet.included_in_random_cast = true;
            }
        }
    }
}

pub fn save(path: &Path, preferences: &PreferencesFile) -> Result<SaveOutcome, String> {
    save_with_sync(path, preferences, sync_directory)
}

pub(crate) fn save_with_sync(
    path: &Path,
    preferences: &PreferencesFile,
    sync: impl FnOnce(&Path) -> Result<(), String>,
) -> Result<SaveOutcome, String> {
    let parent = path
        .parent()
        .ok_or_else(|| "preferences path has no parent".to_string())?;
    fs::create_dir_all(parent)
        .map_err(|error| format!("could not create preferences folder: {error}"))?;
    restrict_directory(parent)?;
    let file_name = format!(".preferences.{}.tmp", std::process::id());
    let temporary = parent.join(file_name);
    let bytes = serde_json::to_vec_pretty(preferences)
        .map_err(|error| format!("could not serialize preferences: {error}"))?;
    let result = (|| {
        let mut options = OpenOptions::new();
        options.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let mut file = options
            .open(&temporary)
            .map_err(|error| format!("could not create temporary preferences: {error}"))?;
        restrict_file(&temporary)?;
        file.write_all(&bytes)
            .and_then(|_| file.write_all(b"\n"))
            .and_then(|_| file.sync_all())
            .map_err(|error| format!("could not write preferences: {error}"))?;
        fs::rename(&temporary, path)
            .map_err(|error| format!("could not replace preferences: {error}"))?;
        Ok(match sync(parent) {
            Ok(()) => SaveOutcome::Durable,
            Err(warning) => SaveOutcome::CommittedWithWarning(warning),
        })
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

pub fn invalid_warning(path: &Path, error: String) -> (String, bool) {
    match preserve_invalid(path) {
        Ok(Some(backup)) => (format!("{error}; preserved as {}", backup.display()), false),
        Ok(None) => (error, false),
        Err(backup_error) => (format!("{error}; {backup_error}"), true),
    }
}

pub fn preserve_invalid(path: &Path) -> Result<Option<PathBuf>, String> {
    if !path.exists() {
        return Ok(None);
    }
    let parent = path
        .parent()
        .ok_or_else(|| "preferences path has no parent".to_string())?;
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let backup = parent.join(format!("preferences.invalid-{stamp}.json"));
    let result: Result<(), String> = (|| {
        let mut source = File::open(path).map_err(|error| error.to_string())?;
        let mut options = OpenOptions::new();
        options.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let mut saved = options.open(&backup).map_err(|error| error.to_string())?;
        std::io::copy(&mut source, &mut saved).map_err(|error| error.to_string())?;
        saved.sync_all().map_err(|error| error.to_string())?;
        restrict_file(&backup)?;
        fs::remove_file(path).map_err(|error| error.to_string())?;
        sync_directory(parent)
    })();
    match result {
        Ok(()) => Ok(Some(backup)),
        Err(error) => {
            if path.exists() {
                let _ = fs::remove_file(&backup);
            }
            Err(format!("could not preserve invalid preferences: {error}"))
        }
    }
}

pub(crate) fn sync_directory(path: &Path) -> Result<(), String> {
    File::open(path)
        .and_then(|directory| directory.sync_all())
        .map_err(|error| format!("could not sync preferences folder: {error}"))
}
