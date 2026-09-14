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
        let canonical_directory = match fs::canonicalize(&directory) {
            Ok(path) => path,
            Err(_) => continue,
        };
        let Some(id) = entry.file_name().to_str().map(str::to_string) else {
            continue;
        };
        let details = match read_regular(&directory.join("pack.json"))
            .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).ok())
        {
            Some(value) => value,
            None => continue,
        };
        let Some(manifest_bytes) = read_regular(&directory.join("flow.json")) else {
            continue;
        };
        let manifest_hash = hex::encode(Sha256::digest(&manifest_bytes));
        if details["manifestSha256"].as_str() != Some(manifest_hash.as_str()) {
            continue;
        }
        let Ok(manifest) = serde_json::from_slice::<Value>(&manifest_bytes) else {
            continue;
        };
        let Some(asset_names) = manifest_assets(&manifest, &id) else {
            continue;
        };
        let Some(asset_hashes) = details["assetSha256"].as_object() else {
            continue;
        };
        let display_name = details["displayName"]
            .as_str()
            .map(str::to_string)
            .unwrap_or_else(|| id.clone());
        let mut assets: HashMap<String, String> = HashMap::new();
        for name in &asset_names {
            if assets.contains_key(name) || name.contains("..") || !name.starts_with("assets/") {
                continue;
            }
            let path = directory.join(name);
            let canonical = match fs::canonicalize(&path) {
                Ok(value) if value.starts_with(&canonical_directory) => value,
                _ => continue,
            };
            let regular = fs::symlink_metadata(&canonical)
                .map(|value| value.file_type().is_file())
                .unwrap_or(false);
            if !regular {
                continue;
            }
            if let Ok(bytes) = fs::read(canonical) {
                let expected_hash = asset_hashes.get(name).and_then(Value::as_str);
                let hash = hex::encode(Sha256::digest(&bytes));
                if expected_hash == Some(hash.as_str())
                    && bytes.len() <= MAX_IMAGE_BYTES
                    && bytes.starts_with(b"\x89PNG")
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
        }
        if assets.len() != asset_names.len() {
            continue;
        }
        result.push(UserPackView {
            id,
            display_name,
            manifest,
            assets,
        });
    }
    result.sort_by(|left, right| left.display_name.cmp(&right.display_name));
    Ok(result)
}
