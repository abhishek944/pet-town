use std::path::PathBuf;
use std::sync::OnceLock;

static DIRECTORY: OnceLock<PathBuf> = OnceLock::new();

pub(crate) fn directory() -> Result<Option<PathBuf>, String> {
    if let Some(path) = DIRECTORY.get() {
        return Ok(Some(path.clone()));
    }
    let resolved = resolve_directory()?;
    if let Some(path) = resolved {
        let _ = DIRECTORY.set(path.clone());
        Ok(Some(DIRECTORY.get().cloned().unwrap_or(path)))
    } else {
        Ok(None)
    }
}

fn resolve_directory() -> Result<Option<PathBuf>, String> {
    if let Some(path) = std::env::var_os("PET_TOWN_PI_RUNTIME") {
        let path = PathBuf::from(path);
        super::runtime_verify::validate(&path)?;
        Ok(Some(path))
    } else if let Some(archive) = archive_path() {
        Ok(Some(super::runtime_install::install(&archive)?))
    } else if cfg!(debug_assertions) {
        Ok(None)
    } else {
        Err("The bundled Pi runtime archive is missing.".into())
    }
}

pub fn path_environment() -> Result<Option<String>, String> {
    let Some(directory) = directory()? else {
        return Ok(None);
    };
    let existing = std::env::var("PATH").unwrap_or_default();
    Ok(Some(format!(
        "{}:{}:{}",
        directory.join("bin").display(),
        directory.display(),
        existing
    )))
}

fn archive_path() -> Option<PathBuf> {
    let executable = std::env::current_exe().ok()?;
    let parent = executable.parent()?;
    let direct = parent.join("pet-town-pi-runtime.tar.gz");
    if direct.is_file() {
        return Some(direct);
    }
    let resources = parent.parent()?.join("Resources");
    [
        resources.join("pet-town-pi-runtime.tar.gz"),
        resources.join("resources/pet-town-pi-runtime.tar.gz"),
    ]
    .into_iter()
    .find(|path| path.is_file())
}
