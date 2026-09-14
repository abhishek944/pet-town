use flate2::read::GzDecoder;
use fs2::FileExt;
use sha2::{Digest, Sha256};
use std::fs::{self, File, OpenOptions};
use std::path::{Component, Path, PathBuf};

pub fn install(archive: &Path) -> Result<PathBuf, String> {
    verify_archive(archive)?;
    let home = std::env::var_os("HOME").ok_or_else(|| "Home folder is unavailable.".to_string())?;
    let base = PathBuf::from(home).join(".pet-village");
    private_directory(&base)?;
    let lock_path = base.join("pi-runtime.lock");
    let lock = OpenOptions::new()
        .create(true)
        .read(true)
        .write(true)
        .open(lock_path)
        .map_err(|_| "Could not lock the bundled Pi runtime.".to_string())?;
    private_file(&lock)?;
    lock.lock_exclusive()
        .map_err(|_| "Could not lock the bundled Pi runtime.".to_string())?;
    let target = base.join(format!("pi-runtime-{}", std::env::consts::ARCH));
    let identity = base.join(format!("pi-runtime-{}.sha256", std::env::consts::ARCH));
    let expected = env!("PET_VILLAGE_PI_RUNTIME_SHA256");
    if fs::read_to_string(&identity).ok().as_deref() == Some(expected)
        && super::runtime_verify::validate(&target).is_ok()
    {
        let _ = lock.unlock();
        return Ok(target);
    }
    let staging = base.join(format!("pi-runtime-next-{}", uuid::Uuid::new_v4()));
    let _ = fs::remove_dir_all(&staging);
    private_directory(&staging)?;
    let result = extract(archive, &staging)
        .and_then(|_| secure_tree(&staging))
        .and_then(|_| super::runtime_verify::validate(&staging))
        .and_then(|_| {
            let _ = fs::remove_dir_all(&target);
            fs::rename(&staging, &target)
                .map_err(|_| "Could not activate the bundled Pi runtime.".to_string())?;
            fs::write(&identity, expected)
                .map_err(|_| "Could not record the bundled Pi runtime identity.".to_string())?;
            private_path(&identity)
        });
    if result.is_err() {
        let _ = fs::remove_dir_all(&staging);
    }
    let _ = lock.unlock();
    result.map(|_| target)
}

fn verify_archive(path: &Path) -> Result<(), String> {
    let expected = env!("PET_VILLAGE_PI_RUNTIME_SHA256");
    if expected.is_empty() {
        return Err("This build has no bundled Pi runtime identity.".into());
    }
    let bytes =
        fs::read(path).map_err(|_| "The bundled Pi runtime archive is missing.".to_string())?;
    let actual = hex::encode(Sha256::digest(bytes));
    (actual == expected)
        .then_some(())
        .ok_or_else(|| "The bundled Pi runtime archive failed its integrity check.".to_string())
}

fn extract(archive: &Path, target: &Path) -> Result<(), String> {
    let file =
        File::open(archive).map_err(|_| "Could not open the bundled Pi runtime.".to_string())?;
    let mut tar = tar::Archive::new(GzDecoder::new(file));
    let mut count = 0usize;
    let mut total = 0u64;
    let entries = tar
        .entries()
        .map_err(|_| "The bundled Pi runtime archive is invalid.".to_string())?;
    for item in entries {
        let mut entry = item.map_err(|_| "The bundled Pi runtime entry is invalid.".to_string())?;
        let path = entry
            .path()
            .map_err(|_| "The bundled Pi runtime path is invalid.".to_string())?;
        if path.is_absolute()
            || path
                .components()
                .any(|part| !matches!(part, Component::Normal(_) | Component::CurDir))
        {
            return Err("The bundled Pi runtime archive contains an unsafe path.".into());
        }
        let kind = entry.header().entry_type();
        if !kind.is_file() && !kind.is_dir() {
            return Err("The bundled Pi runtime archive contains an unsafe entry.".into());
        }
        count += 1;
        total = total.saturating_add(entry.size());
        if count > 50_000 || total > 700 * 1024 * 1024 {
            return Err("The bundled Pi runtime archive exceeds its safety limits.".into());
        }
        entry
            .unpack_in(target)
            .map_err(|_| "Could not extract the bundled Pi runtime.".to_string())?;
    }
    Ok(())
}

#[cfg(unix)]
fn secure_tree(root: &Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    let mut pending = vec![root.to_path_buf()];
    while let Some(directory) = pending.pop() {
        fs::set_permissions(&directory, fs::Permissions::from_mode(0o700))
            .map_err(|_| "Could not protect the private runtime folder.".to_string())?;
        for entry in fs::read_dir(&directory)
            .map_err(|_| "Could not inspect the private runtime folder.".to_string())?
        {
            let path = entry
                .map_err(|_| "Could not inspect the private runtime.".to_string())?
                .path();
            let metadata = fs::symlink_metadata(&path)
                .map_err(|_| "Could not inspect the private runtime.".to_string())?;
            if metadata.is_dir() {
                pending.push(path);
            } else if metadata.is_file() {
                let mode = if metadata.permissions().mode() & 0o111 == 0 {
                    0o600
                } else {
                    0o700
                };
                fs::set_permissions(path, fs::Permissions::from_mode(mode))
                    .map_err(|_| "Could not protect the private runtime file.".to_string())?;
            } else {
                return Err("The private runtime contains an unsafe entry.".into());
            }
        }
    }
    Ok(())
}

#[cfg(not(unix))]
fn secure_tree(_root: &Path) -> Result<(), String> {
    Ok(())
}

#[cfg(unix)]
fn private_directory(path: &Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    fs::create_dir_all(path)
        .map_err(|_| "Could not create the private runtime folder.".to_string())?;
    fs::set_permissions(path, fs::Permissions::from_mode(0o700))
        .map_err(|_| "Could not protect the private runtime folder.".to_string())
}

#[cfg(unix)]
fn private_path(path: &Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o600))
        .map_err(|_| "Could not protect the private runtime identity.".to_string())
}

#[cfg(unix)]
fn private_file(file: &File) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    file.set_permissions(fs::Permissions::from_mode(0o600))
        .map_err(|_| "Could not protect the private runtime lock.".to_string())
}
