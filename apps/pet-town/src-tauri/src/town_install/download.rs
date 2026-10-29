use super::{local, network::fetch, TownInstall};
use base64::Engine;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{collections::HashMap, fs::File, io::Read, path::Path, time::Duration};
use tauri::{AppHandle, Manager};
const MAX_DOWNLOAD: u64 = 1024 * 1024 * 1024;
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Manifest {
    format_version: u32,
    version: String,
    platforms: HashMap<String, Asset>,
}
#[derive(Deserialize)]
struct Asset {
    url: String,
    signature: String,
    sha256: String,
    size: u64,
}

pub(super) async fn run(app: &AppHandle, archive: &Path) -> Result<(), String> {
    let target = local::target()?;
    let base = format!(
        "https://github.com/abhishek944/pet-town/releases/download/v{}/",
        local::VERSION
    );
    let name = if target == "darwin-aarch64" {
        "Pet-Town-World-macOS-Apple-Silicon.tar.gz"
    } else {
        "Pet-Town-World-macOS-Intel.tar.gz"
    };
    let client = reqwest::Client::builder()
        .https_only(true)
        .connect_timeout(Duration::from_secs(15))
        .read_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(15 * 60))
        .build()
        .map_err(|e| e.to_string())?;
    let bytes = fetch(
        &client,
        &format!("{base}town-component.json"),
        64 * 1024,
        app,
        None,
    )
    .await?;
    let manifest: Manifest = serde_json::from_slice(&bytes).map_err(|e| e.to_string())?;
    let asset = manifest
        .platforms
        .get(target)
        .ok_or("No Pet Town download is available for this Mac.")?;
    if manifest.format_version != 1
        || manifest.version != local::VERSION
        || asset.url != format!("{base}{name}")
        || asset.size == 0
        || asset.size > MAX_DOWNLOAD
        || asset.sha256.len() != 64
        || asset.signature.len() > 8192
    {
        return Err("Invalid Pet Town release manifest.".into());
    }
    app.state::<TownInstall>().lock().snapshot.total_bytes = Some(asset.size);
    fetch(&client, &asset.url, asset.size, app, Some(archive)).await?;
    let signature = asset.signature.clone();
    let expected_hash = asset.sha256.clone();
    let size = asset.size;
    let app = app.clone();
    let path = archive.to_owned();
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<TownInstall>();
        state.phase(&app, "verifying");
        let key = app
            .config()
            .plugins
            .0
            .get("updater")
            .and_then(|p| p.get("pubkey"))
            .and_then(serde_json::Value::as_str)
            .ok_or("Missing updater public key.")?;
        let decode = |s: &str| -> Result<String, String> {
            String::from_utf8(
                base64::engine::general_purpose::STANDARD
                    .decode(s.trim())
                    .map_err(|e| e.to_string())?,
            )
            .map_err(|e| e.to_string())
        };
        let public =
            minisign_verify::PublicKey::decode(&decode(key)?).map_err(|e| e.to_string())?;
        let signature =
            minisign_verify::Signature::decode(&decode(&signature)?).map_err(|e| e.to_string())?;
        let mut verifier = public
            .verify_stream(&signature)
            .map_err(|e| e.to_string())?;
        let mut file = File::open(path).map_err(|e| e.to_string())?;
        if file.metadata().map_err(|e| e.to_string())?.len() != size {
            return Err("Incomplete Pet Town download.".into());
        }
        let mut hash = Sha256::new();
        let mut buffer = [0u8; 64 * 1024];
        loop {
            state.check_cancel()?;
            let n = file.read(&mut buffer).map_err(|e| e.to_string())?;
            if n == 0 {
                break;
            }
            verifier.update(&buffer[..n]);
            hash.update(&buffer[..n]);
        }
        verifier.finalize().map_err(|e| e.to_string())?;
        if hex::encode(hash.finalize()) != expected_hash.to_ascii_lowercase() {
            return Err("Pet Town checksum did not match.".into());
        }
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}
