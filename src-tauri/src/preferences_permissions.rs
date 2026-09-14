use std::fs;
use std::path::Path;

#[cfg(unix)]
pub fn restrict_directory(path: &Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o700))
        .map_err(|error| format!("could not secure preferences folder: {error}"))
}

#[cfg(not(unix))]
pub fn restrict_directory(_path: &Path) -> Result<(), String> {
    Ok(())
}

#[cfg(unix)]
pub fn restrict_file(path: &Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o600))
        .map_err(|error| format!("could not secure preferences file: {error}"))
}

#[cfg(not(unix))]
pub fn restrict_file(_path: &Path) -> Result<(), String> {
    Ok(())
}
