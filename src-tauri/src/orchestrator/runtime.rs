use std::path::PathBuf;

pub fn path_environment() -> Result<Option<String>, String> {
    let directory = if let Some(path) = std::env::var_os("PET_VILLAGE_PI_RUNTIME") {
        let path = PathBuf::from(path);
        super::runtime_verify::validate(&path)?;
        Some(path)
    } else if let Some(archive) = archive_path() {
        Some(super::runtime_install::install(&archive)?)
    } else if cfg!(debug_assertions) {
        None
    } else {
        return Err("The bundled Pi runtime archive is missing.".into());
    };
    let Some(directory) = directory else {
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
