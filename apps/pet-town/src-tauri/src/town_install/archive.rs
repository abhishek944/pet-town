use super::{local, TownInstall};
use std::{
    collections::HashSet,
    fs::{self, File},
    io::{Read, Write},
    path::{Component, Path},
};
use tauri::{AppHandle, Manager};

pub(super) fn extract(app: &AppHandle, archive: &Path, stage: &Path) -> Result<(), String> {
    let state = app.state::<TownInstall>();
    let mut archive = tar::Archive::new(flate2::read::GzDecoder::new(
        File::open(archive).map_err(|e| e.to_string())?,
    ));
    let mut total = 0u64;
    let mut seen = HashSet::new();
    let mut entries = 0usize;
    for entry in archive.entries().map_err(|e| e.to_string())? {
        state.check_cancel()?;
        let mut entry = entry.map_err(|e| e.to_string())?;
        entries += 1;
        if entries > 100_000 {
            return Err("Too many Town archive entries.".into());
        }
        let path = entry.path().map_err(|e| e.to_string())?.into_owned();
        if path
            .components()
            .any(|c| !matches!(c, Component::Normal(_)))
            || !(path.starts_with("Pet Town.app") || path == Path::new("town-component.json"))
            || !seen.insert(path.clone())
        {
            return Err("Unsafe or duplicate Town archive path.".into());
        }
        let kind = entry.header().entry_type();
        if !kind.is_file() && !kind.is_dir() {
            return Err("Town archives may contain only regular files and directories.".into());
        }
        total = total
            .checked_add(entry.size())
            .ok_or("Town archive size overflow.")?;
        if total > 4 * 1024 * 1024 * 1024
            || (path == Path::new("town-component.json") && entry.size() > 64 * 1024)
        {
            return Err("Expanded Town archive exceeds its size limit.".into());
        }
        let output = stage.join(&path);
        if kind.is_dir() {
            fs::create_dir_all(&output).map_err(|e| e.to_string())?;
            continue;
        }
        fs::create_dir_all(output.parent().ok_or("Invalid archive parent.")?)
            .map_err(|e| e.to_string())?;
        let mut file = fs::OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&output)
            .map_err(|e| e.to_string())?;
        let mut buffer = [0u8; 64 * 1024];
        loop {
            state.check_cancel()?;
            let n = entry.read(&mut buffer).map_err(|e| e.to_string())?;
            if n == 0 {
                break;
            }
            file.write_all(&buffer[..n]).map_err(|e| e.to_string())?;
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mode = entry.header().mode().map_err(|e| e.to_string())? & 0o777;
            fs::set_permissions(&output, fs::Permissions::from_mode(mode))
                .map_err(|e| e.to_string())?;
        }
    }
    state.check_cancel()?;
    local::validate(stage)?;
    Ok(())
}
