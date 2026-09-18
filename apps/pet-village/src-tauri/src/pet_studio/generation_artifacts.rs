use super::types::MAX_IMAGE_BYTES;
use std::fs;
use std::path::{Path, PathBuf};

pub fn safe_directory(root: &Path, reported: &Path) -> Result<PathBuf, String> {
    let root = fs::canonicalize(root)
        .map_err(|_| "Could not inspect the private Pet Studio draft.".to_string())?;
    let metadata = fs::symlink_metadata(reported)
        .map_err(|_| "The image worker output directory is missing.".to_string())?;
    if !metadata.is_dir() || metadata.file_type().is_symlink() {
        return Err("The image worker returned an unsafe output directory.".into());
    }
    let path = fs::canonicalize(reported)
        .map_err(|_| "Could not inspect an image worker output directory.".to_string())?;
    path.starts_with(&root)
        .then_some(path)
        .ok_or_else(|| "The image worker returned a directory outside the private draft.".into())
}

pub fn safe_artifact(root: &Path, reported: &Path) -> Result<PathBuf, String> {
    let root = fs::canonicalize(root)
        .map_err(|_| "Could not inspect the private Pet Studio draft.".to_string())?;
    let metadata = fs::symlink_metadata(reported)
        .map_err(|_| "The image worker output is missing.".to_string())?;
    if !metadata.is_file() || metadata.file_type().is_symlink() {
        return Err("The image worker returned an unsafe output file.".into());
    }
    let path = fs::canonicalize(reported)
        .map_err(|_| "Could not inspect an image worker output.".to_string())?;
    if !path.starts_with(&root) {
        return Err("The image worker returned a path outside the private draft.".into());
    }
    Ok(path)
}

pub fn read_image(root: &Path, reported: &Path) -> Result<Vec<u8>, String> {
    let path = safe_artifact(root, reported)?;
    let metadata =
        fs::metadata(&path).map_err(|_| "Could not inspect a generated image.".to_string())?;
    if metadata.len() > MAX_IMAGE_BYTES as u64 {
        return Err("Generated image exceeds the 20 MB limit.".into());
    }
    fs::read(path).map_err(|_| "Could not read a generated image.".to_string())
}
