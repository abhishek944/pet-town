use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::path::{Component, Path, PathBuf};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RuntimeManifest {
    format_version: u8,
    architecture: String,
    node_version: String,
    pi_version: String,
    node_sha256: String,
    launcher_sha256: String,
    entrypoint_sha256: String,
    files: BTreeMap<String, String>,
}

pub fn validate(root: &Path) -> Result<(), String> {
    let bytes = std::fs::read(root.join("runtime-manifest.json"))
        .map_err(|_| "Bundled Pi runtime manifest is missing.".to_string())?;
    let manifest: RuntimeManifest = serde_json::from_slice(&bytes)
        .map_err(|_| "Bundled Pi runtime manifest is invalid.".to_string())?;
    let expected_arch = if cfg!(target_arch = "aarch64") {
        "arm64"
    } else {
        "x64"
    };
    if manifest.format_version != 1
        || manifest.architecture != expected_arch
        || manifest.node_version != "22.21.1"
        || manifest.pi_version != "0.85.1"
        || manifest.files.len() > 50_000
    {
        return Err("Bundled Pi runtime does not match this application.".into());
    }
    for (relative, expected) in &manifest.files {
        let path = safe_join(root, relative)?;
        verify(path, expected)?;
    }
    verify(root.join("node"), &manifest.node_sha256)?;
    verify(root.join("bin/pi"), &manifest.launcher_sha256)?;
    verify(
        root.join("package/node_modules/@earendil-works/pi-coding-agent/dist/cli.js"),
        &manifest.entrypoint_sha256,
    )?;
    let actual = count_files(root)?;
    if actual != manifest.files.len() + 1 {
        return Err("Bundled Pi runtime contains unexpected files.".into());
    }
    Ok(())
}

fn safe_join(root: &Path, relative: &str) -> Result<PathBuf, String> {
    let path = Path::new(relative);
    if path.is_absolute()
        || path
            .components()
            .any(|part| !matches!(part, Component::Normal(_)))
    {
        return Err("Bundled Pi runtime manifest contains an unsafe path.".into());
    }
    Ok(root.join(path))
}

fn verify(path: PathBuf, expected: &str) -> Result<(), String> {
    let metadata = std::fs::symlink_metadata(&path)
        .map_err(|_| "Bundled Pi runtime file is missing.".to_string())?;
    if !metadata.file_type().is_file() {
        return Err("Bundled Pi runtime contains an unsafe file.".into());
    }
    let bytes = std::fs::read(path)
        .map_err(|_| "Bundled Pi runtime file could not be read.".to_string())?;
    let actual = hex::encode(Sha256::digest(bytes));
    (actual == expected)
        .then_some(())
        .ok_or_else(|| "Bundled Pi runtime integrity check failed.".to_string())
}

fn count_files(root: &Path) -> Result<usize, String> {
    let mut count = 0;
    let mut pending = vec![root.to_path_buf()];
    while let Some(directory) = pending.pop() {
        for entry in std::fs::read_dir(directory)
            .map_err(|_| "Bundled Pi runtime could not be inspected.".to_string())?
        {
            let entry = entry.map_err(|_| "Bundled Pi runtime entry is invalid.".to_string())?;
            let kind = entry
                .file_type()
                .map_err(|_| "Bundled Pi runtime entry is invalid.".to_string())?;
            if kind.is_dir() {
                pending.push(entry.path());
            } else if kind.is_file() {
                count += 1;
            } else {
                return Err("Bundled Pi runtime contains an unsafe entry.".into());
            }
        }
    }
    Ok(count)
}
