use super::manifest;
use super::types::{Draft, SavePackRequest};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

pub fn root() -> Result<PathBuf, String> {
    let home = std::env::var_os("HOME").ok_or_else(|| "Home folder is unavailable.".to_string())?;
    Ok(PathBuf::from(home).join(".pet-village").join("pet-packs"))
}

pub fn safe_id(value: &str, label: &str) -> Result<String, String> {
    let normalized = value
        .trim()
        .to_lowercase()
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() {
                character
            } else {
                '-'
            }
        })
        .collect::<String>()
        .split('-')
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("-");
    if normalized.is_empty() || normalized.len() > 48 {
        return Err(format!("{label} needs a short letter-and-number name."));
    }
    Ok(normalized)
}

pub fn flow_id(value: &str, label: &str) -> Result<String, String> {
    let id = safe_id(value, label)?;
    if !id.starts_with(|character: char| character.is_ascii_lowercase()) {
        return Err(format!("{label} must start with a letter."));
    }
    Ok(id)
}

pub fn pack_id(value: &str) -> Result<String, String> {
    if value.is_empty()
        || value.len() > 64
        || !value.starts_with(|character: char| character.is_ascii_lowercase())
        || value.chars().any(|character| {
            !character.is_ascii_lowercase() && !character.is_ascii_digit() && character != '-'
        })
    {
        return Err("Choose a valid installed pet.".into());
    }
    Ok(value.to_string())
}

fn reject_private_symlinks(path: &Path) -> Result<(), String> {
    for candidate in path.ancestors() {
        if fs::symlink_metadata(candidate)
            .map(|metadata| metadata.file_type().is_symlink())
            .unwrap_or(false)
        {
            return Err("Pet Studio storage cannot use symbolic links.".into());
        }
        if candidate.file_name().and_then(|name| name.to_str()) == Some(".pet-village") {
            break;
        }
    }
    Ok(())
}

pub fn create_private_dir(path: &Path) -> Result<(), String> {
    reject_private_symlinks(path)?;
    fs::create_dir_all(path).map_err(|_| "Could not create the private pet folder.".to_string())?;
    reject_private_symlinks(path)?;
    for directory in path.ancestors() {
        secure_dir(directory)?;
        if directory.file_name().and_then(|name| name.to_str()) == Some(".pet-village") {
            break;
        }
    }
    Ok(())
}

pub fn write_private(path: &Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        create_private_dir(parent)?;
    }
    let mut options = OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options
        .open(path)
        .map_err(|_| "Could not create a pet file.".to_string())?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| "Could not save a pet file.".to_string())
}

#[cfg(unix)]
pub(crate) fn secure_dir(path: &Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o700))
        .map_err(|_| "Could not secure the pet folder.".to_string())
}
#[cfg(not(unix))]
pub(crate) fn secure_dir(_path: &Path) -> Result<(), String> {
    Ok(())
}

pub fn save(request: &SavePackRequest, draft: &Draft) -> Result<String, String> {
    let display_name = request.display_name.trim();
    if display_name.is_empty() || display_name.len() > 64 {
        return Err("Pet name must contain 1–64 characters.".into());
    }
    let slug = safe_id(display_name, "Pet")?;
    let digest = hex::encode(Sha256::digest(draft.id.as_bytes()));
    let id = format!("user-{slug}-{}", &digest[..8]);
    let root = root()?;
    let staging_root = root.join(".staging");
    create_private_dir(&staging_root)?;
    let staging = staging_root.join(uuid::Uuid::new_v4().to_string());
    fs::create_dir(&staging).map_err(|_| "Could not create pet staging.".to_string())?;
    secure_dir(&staging)?;
    let result = (|| {
        let value = manifest::build(&id, request, draft)?;
        let animations = value["clips"]
            .as_object()
            .ok_or_else(|| "Pet clips are invalid.".to_string())?;
        create_private_dir(&staging.join("assets"))?;
        let mut asset_hashes = BTreeMap::new();
        for name in animations.keys() {
            let source = draft.animations[name].apng.as_ref().unwrap();
            let bytes =
                fs::read(source).map_err(|_| "Could not stage an animation.".to_string())?;
            write_private(&staging.join("assets").join(format!("{name}.png")), &bytes)?;
            asset_hashes.insert(
                format!("assets/{name}.png"),
                hex::encode(Sha256::digest(&bytes)),
            );
        }
        let manifest_bytes = serde_json::to_vec_pretty(&value)
            .map_err(|_| "Could not encode the pet manifest.".to_string())?;
        write_private(&staging.join("flow.json"), &manifest_bytes)?;
        let details = json!({
            "displayName": display_name,
            "manifestSha256": hex::encode(Sha256::digest(&manifest_bytes)),
            "assetSha256": asset_hashes,
        });
        write_private(
            &staging.join("pack.json"),
            &serde_json::to_vec_pretty(&details)
                .map_err(|_| "Could not encode pet details.".to_string())?,
        )?;
        let packs = root.join("packs");
        create_private_dir(&packs)?;
        let target = packs.join(&id);
        if target.exists() {
            return Err("A pet with this name already exists. Choose another name.".into());
        }
        fs::rename(&staging, &target)
            .map_err(|_| "Could not activate the pet pack.".to_string())?;
        Ok(id.clone())
    })();
    if result.is_err() {
        let _ = fs::remove_dir_all(staging);
    }
    result
}
