//! Trusted checkout validation and the Mayor's isolated Firstmate home.
use crate::preferences::PreferencesStore;
use sha2::{Digest, Sha256};
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

pub(super) fn configured(
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

pub(super) fn checkout(path: &str) -> Result<PathBuf, String> {
    let folder = Path::new(path)
        .canonicalize()
        .map_err(|_| "Choose an existing Firstmate folder.".to_string())?;
    if !folder.join("AGENTS.md").is_file() || !folder.join(".pi").is_dir() {
        return Err("Choose the Firstmate checkout containing AGENTS.md and .pi.".into());
    }
    Ok(folder)
}

pub(super) fn mayor_home(folder: &Path) -> Result<PathBuf, String> {
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
