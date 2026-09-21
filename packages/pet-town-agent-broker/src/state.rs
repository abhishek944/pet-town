use std::path::PathBuf;

fn configured_state_dir() -> Option<PathBuf> {
    if let Some(registry) = std::env::var_os("PET_TOWN_SESSION_REGISTRY") {
        return PathBuf::from(registry).parent().map(PathBuf::from);
    }
    let home = std::env::var_os("HOME")?;
    let pointer = PathBuf::from(home)
        .join(".local/state/pet-town")
        .join("herdr-state-dir");
    let value = std::fs::read_to_string(pointer).ok()?;
    let value = value.trim();
    (!value.is_empty()).then(|| PathBuf::from(value))
}

pub(crate) fn session_registry() -> Option<PathBuf> {
    std::env::var_os("PET_TOWN_SESSION_REGISTRY")
        .map(PathBuf::from)
        .or_else(|| configured_state_dir().map(|path| path.join("sessions")))
}
