use super::store;
use super::types::{UserPackView, MAX_IMAGE_BYTES};
use base64::Engine;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

fn manifest_assets(value: &Value, id: &str) -> Option<Vec<String>> {
    if !id.starts_with("user-") || value["formatVersion"] != 1 || value["id"] != id {
        return None;
    }
    let states = value["states"].as_object()?;
    if ["idle", "working", "blocked", "done", "unknown"]
        .iter()
        .any(|key| !states.contains_key(*key))
    {
        return None;
    }
    let clips = value["clips"].as_object()?;
    let names = clips
        .values()
        .map(|clip| clip["asset"].as_str().map(str::to_string))
        .collect::<Option<Vec<_>>>()?;
    (!names.is_empty()).then_some(names)
}

pub(crate) fn read_regular(path: &Path) -> Option<Vec<u8>> {
    fs::symlink_metadata(path)
        .ok()?
        .file_type()
        .is_file()
        .then(|| fs::read(path).ok())
        .flatten()
}

fn load(directory: &Path, id: &str) -> Option<UserPackView> {
    let canonical_directory = fs::canonicalize(directory).ok()?;
    let details = read_regular(&directory.join("pack.json"))
        .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).ok())?;
    let manifest_bytes = read_regular(&directory.join("flow.json"))?;
    let manifest_hash = hex::encode(Sha256::digest(&manifest_bytes));
    if details["manifestSha256"].as_str() != Some(manifest_hash.as_str()) {
        return None;
    }
    let manifest = serde_json::from_slice::<Value>(&manifest_bytes).ok()?;
    let asset_names = manifest_assets(&manifest, id)?;
    let asset_hashes = details["assetSha256"].as_object()?;
    let display_name = details["displayName"]
        .as_str()
        .map(str::to_string)
        .unwrap_or_else(|| id.to_string());
    let mut assets: HashMap<String, String> = HashMap::new();
    for name in &asset_names {
        if assets.contains_key(name) || name.contains("..") || !name.starts_with("assets/") {
            continue;
        }
        let path = fs::canonicalize(directory.join(name)).ok()?;
        if !path.starts_with(&canonical_directory)
            || !fs::symlink_metadata(&path).ok()?.file_type().is_file()
        {
            continue;
        }
        let bytes = fs::read(path).ok()?;
        let expected_hash = asset_hashes.get(name).and_then(Value::as_str);
        let hash = hex::encode(Sha256::digest(&bytes));
        if expected_hash == Some(hash.as_str())
            && bytes.len() <= MAX_IMAGE_BYTES
            && super::apng::validate(&bytes).is_ok()
        {
            assets.insert(
                name.to_string(),
                format!(
                    "data:image/png;base64,{}",
                    base64::engine::general_purpose::STANDARD.encode(bytes)
                ),
            );
        }
    }
    (assets.len() == asset_names.len()).then_some(UserPackView {
        id: id.to_string(),
        display_name,
        manifest,
        assets,
    })
}

pub fn list() -> Result<Vec<UserPackView>, String> {
    let packs = store::root()?.join("packs");
    let entries = match fs::read_dir(&packs) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(vec![]),
        Err(_) => return Err("Could not read user pets.".into()),
    };
    let mut result = Vec::new();
    for entry in entries
        .flatten()
        .filter(|entry| entry.file_type().map(|kind| kind.is_dir()).unwrap_or(false))
    {
        let directory = entry.path();
        let Some(id) = entry.file_name().to_str().map(str::to_string) else {
            continue;
        };
        if let Some(pack) = load(&directory, &id) {
            result.push(pack);
        }
    }
    result.sort_by(|left, right| left.display_name.cmp(&right.display_name));
    Ok(result)
}
