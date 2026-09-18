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
    if let Some(path) = std::env::var_os("PET_VILLAGE_PI_RUNTIME") {
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

pub(crate) fn image_worker_available() -> bool {
    if let Some(path) = std::env::var_os("PET_VILLAGE_PI_RUNTIME") {
        return super::runtime_verify::validate(&PathBuf::from(path)).is_ok();
    }
    if cfg!(debug_assertions) {
        let app = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..");
        return app.join("scripts/pet-studio-image-worker.mjs").is_file()
            && app
                .join("node_modules/@abhishek944/pi-image-gen/dist/index.js")
                .is_file();
    }
    archive_path().is_some()
}

fn archive_path() -> Option<PathBuf> {
    let executable = std::env::current_exe().ok()?;
    let parent = executable.parent()?;
    let direct = parent.join("pet-village-pi-runtime.tar.gz");
    if direct.is_file() {
        return Some(direct);
    }
    let resources = parent.parent()?.join("Resources");
    [
        resources.join("pet-village-pi-runtime.tar.gz"),
        resources.join("resources/pet-village-pi-runtime.tar.gz"),
    ]
    .into_iter()
    .find(|path| path.is_file())
}
