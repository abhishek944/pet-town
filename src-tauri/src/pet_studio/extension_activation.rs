use super::catalog::read_regular;
use super::store::{create_private_dir, pack_id, root, write_private};
use super::types::StoredPetExtension;
use fs2::FileExt;
use std::fs::{self, OpenOptions};
use std::path::{Path, PathBuf};

fn extension_root(base_id: &str) -> Result<PathBuf, String> {
    Ok(root()?.join("extensions").join(pack_id(base_id)?))
}

fn lock(directory: &Path) -> Result<std::fs::File, String> {
    create_private_dir(directory)?;
    let mut options = OpenOptions::new();
    options.read(true).write(true).create(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW).mode(0o600);
    }
    let file = options
        .open(directory.join("activation.lock"))
        .map_err(|_| "Could not open the pet extension lock.".to_string())?;
    if !file
        .metadata()
        .map(|value| value.is_file())
        .unwrap_or(false)
    {
        return Err("The pet extension lock is unsafe.".into());
    }
    file.lock_exclusive()
        .map_err(|_| "Could not lock the pet extension.".to_string())?;
    Ok(file)
}

fn stored(directory: &Path, candidate_id: &str) -> Result<StoredPetExtension, String> {
    uuid::Uuid::parse_str(candidate_id)
        .map_err(|_| "The staged pet extension is invalid.".to_string())?;
    let path = directory
        .join("versions")
        .join(candidate_id)
        .join("extension.json");
    serde_json::from_slice(
        &read_regular(&path).ok_or_else(|| "The staged pet extension is missing.".to_string())?,
    )
    .map_err(|_| "The staged pet extension is invalid.".to_string())
}

pub fn activate(base_id: &str, candidate_id: &str, draft_id: &str) -> Result<String, String> {
    let base_id = pack_id(base_id)?;
    let directory = extension_root(&base_id)?;
    let lock = lock(&directory)?;
    super::extension_catalog::candidate(&base_id, candidate_id)?;
    let extension = stored(&directory, candidate_id)?;
    if extension.draft_id.as_deref() != Some(draft_id) {
        return Err("This draft does not own the staged pet extension.".into());
    }
    let current = super::extension_catalog::active_version(&base_id)?;
    if current != extension.parent_extension_version {
        let _ = FileExt::unlock(&lock);
        return Err("This pet changed while the extension was being reviewed. Start a fresh extension draft.".into());
    }
    let pointer = directory.join(format!(".active-{candidate_id}"));
    write_private(&pointer, candidate_id.as_bytes())?;
    if let Err(error) = fs::rename(&pointer, directory.join("active")) {
        let _ = fs::remove_file(pointer);
        let _ = FileExt::unlock(&lock);
        return Err(format!("Could not activate the pet extension: {error}"));
    }
    let _ = FileExt::unlock(&lock);
    Ok(base_id)
}

pub fn discard(base_id: &str, candidate_id: &str) -> Result<(), String> {
    let base_id = pack_id(base_id)?;
    uuid::Uuid::parse_str(candidate_id)
        .map_err(|_| "The staged pet extension is invalid.".to_string())?;
    let directory = extension_root(&base_id)?;
    let lock = lock(&directory)?;
    if super::extension_catalog::active_version(&base_id)?.as_deref() == Some(candidate_id) {
        let _ = FileExt::unlock(&lock);
        return Err("The active pet extension cannot be discarded.".into());
    }
    let versions = directory.join("versions");
    create_private_dir(&versions)?;
    let candidate = versions.join(candidate_id);
    let candidate_kind = fs::symlink_metadata(&candidate)
        .map_err(|_| "The staged pet extension is missing.".to_string())?
        .file_type();
    if candidate_kind.is_symlink() || !candidate_kind.is_dir() {
        let _ = FileExt::unlock(&lock);
        return Err("The staged pet extension path is unsafe.".into());
    }
    let canonical_versions = fs::canonicalize(&versions)
        .map_err(|_| "Pet extension storage is unavailable.".to_string())?;
    let canonical_candidate = fs::canonicalize(&candidate)
        .map_err(|_| "The staged pet extension is missing.".to_string())?;
    if !canonical_candidate.starts_with(&canonical_versions) {
        let _ = FileExt::unlock(&lock);
        return Err("The staged pet extension path is unsafe.".into());
    }
    fs::remove_dir_all(canonical_candidate)
        .map_err(|_| "Could not discard the staged pet extension.".to_string())?;
    let _ = FileExt::unlock(&lock);
    Ok(())
}
