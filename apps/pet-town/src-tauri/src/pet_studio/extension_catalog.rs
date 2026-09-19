use super::catalog::read_regular;
use super::store;
use super::types::{
    PetExtensionCatalogView, PetExtensionView, StoredPetExtension, MAX_IMAGE_BYTES,
};
use base64::Engine;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

fn directory(base_id: &str) -> Result<PathBuf, String> {
    Ok(store::root()?
        .join("extensions")
        .join(store::pack_id(base_id)?))
}

fn read_active(directory: &Path) -> Result<Option<String>, String> {
    let path = directory.join("active");
    let metadata = match fs::symlink_metadata(&path) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(_) => return Err("The existing pet extension is damaged.".into()),
    };
    if metadata.file_type().is_symlink() || !metadata.file_type().is_file() {
        return Err("The existing pet extension is damaged.".into());
    }
    let bytes =
        read_regular(&path).ok_or_else(|| "The existing pet extension is damaged.".to_string())?;
    let version = String::from_utf8(bytes)
        .map_err(|_| "The existing pet extension is damaged.".to_string())?;
    uuid::Uuid::parse_str(version.trim())
        .map_err(|_| "The existing pet extension is damaged.".to_string())?;
    Ok(Some(version.trim().to_string()))
}

fn load_version(directory: &Path, base_id: &str, version: &str) -> Option<PetExtensionView> {
    uuid::Uuid::parse_str(version).ok()?;
    let version_directory = directory.join("versions").join(version);
    let canonical_version = fs::canonicalize(&version_directory).ok()?;
    let canonical_directory = fs::canonicalize(directory).ok()?;
    if !canonical_version.starts_with(&canonical_directory) {
        return None;
    }
    let details = read_regular(&version_directory.join("extension-pack.json"))
        .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).ok())?;
    let extension_bytes = read_regular(&version_directory.join("extension.json"))?;
    let extension_hash = hex::encode(Sha256::digest(&extension_bytes));
    if details["extensionSha256"].as_str() != Some(extension_hash.as_str()) {
        return None;
    }
    let extension = serde_json::from_slice::<StoredPetExtension>(&extension_bytes).ok()?;
    if extension.format_version != 1
        || extension.base_id != base_id
        || extension.extension_version != version
    {
        return None;
    }
    let asset_hashes = details["assetSha256"].as_object()?;
    let mut assets = HashMap::new();
    for (name, clip) in &extension.clips {
        let asset = clip["asset"].as_str()?;
        if asset != format!("assets/{name}.png") || assets.contains_key(asset) {
            return None;
        }
        let path = version_directory.join(asset);
        let canonical = fs::canonicalize(&path).ok()?;
        if !canonical.starts_with(&canonical_version)
            || !fs::symlink_metadata(&canonical).ok()?.file_type().is_file()
        {
            return None;
        }
        let bytes = fs::read(canonical).ok()?;
        let hash = hex::encode(Sha256::digest(&bytes));
        if asset_hashes.get(asset).and_then(Value::as_str) != Some(hash.as_str())
            || bytes.len() > MAX_IMAGE_BYTES
            || !bytes.starts_with(b"\x89PNG")
        {
            return None;
        }
        assets.insert(
            asset.to_string(),
            format!(
                "data:image/png;base64,{}",
                base64::engine::general_purpose::STANDARD.encode(bytes)
            ),
        );
    }
    (assets.len() == asset_hashes.len()).then_some(PetExtensionView {
        base_id: extension.base_id,
        extension_version: extension.extension_version,
        clips: extension.clips,
        states: extension.states,
        actions: extension.actions,
        assets,
    })
}

pub fn active_version(base_id: &str) -> Result<Option<String>, String> {
    read_active(&directory(base_id)?)
}

pub fn get(base_id: &str) -> Result<Option<PetExtensionView>, String> {
    let directory = directory(base_id)?;
    let Some(version) = read_active(&directory)? else {
        return Ok(None);
    };
    load_version(&directory, base_id, &version)
        .ok_or_else(|| "The existing pet extension is damaged; it was not replaced.".to_string())
        .map(Some)
}

pub fn candidate(base_id: &str, version: &str) -> Result<PetExtensionView, String> {
    let directory = directory(base_id)?;
    load_version(&directory, base_id, version)
        .ok_or_else(|| "The staged pet extension is invalid.".to_string())
}

pub fn list() -> Result<PetExtensionCatalogView, String> {
    let root = store::root()?.join("extensions");
    let entries = match fs::read_dir(&root) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Ok(PetExtensionCatalogView {
                extensions: vec![],
                warnings: vec![],
            });
        }
        Err(_) => return Err("Could not read pet extensions.".into()),
    };
    let mut extensions = Vec::new();
    let mut warnings = Vec::new();
    for entry in entries
        .flatten()
        .filter(|entry| entry.file_type().map(|kind| kind.is_dir()).unwrap_or(false))
    {
        let Some(id) = entry.file_name().to_str().map(str::to_string) else {
            continue;
        };
        match get(&id) {
            Ok(Some(extension)) => extensions.push(extension),
            Ok(None) => {}
            Err(error) => warnings.push(format!("{id}: {error}")),
        }
    }
    extensions.sort_by(|left, right| left.base_id.cmp(&right.base_id));
    warnings.sort();
    Ok(PetExtensionCatalogView {
        extensions,
        warnings,
    })
}
