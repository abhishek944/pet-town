use super::{dependency, model::Dependency, Onboarding};
use sha2::{Digest, Sha256};
use std::{fs, io::Write, time::Duration};
use tauri::{AppHandle, Manager};
const RELEASE: &str = "https://api.github.com/repos/herdrdev/herdr/releases/latest";
const LIMIT: usize = 128 * 1024 * 1024;

pub(super) async fn run(app: &AppHandle) -> Result<(), String> {
    let existing = tauri::async_runtime::spawn_blocking(dependency::check)
        .await
        .map_err(|_| "Could not check Herdr.")?;
    if existing.phase != "missing" {
        return Err(
            "Herdr is already installed. Open or repair its existing installation instead.".into(),
        );
    }
    if !cfg!(target_os = "macos") {
        return Err("Automatic Herdr installation is currently available on macOS. Use the installation guide for this platform.".into());
    }
    let client = reqwest::Client::builder()
        .user_agent("PetTown-Onboarding")
        .timeout(Duration::from_secs(120))
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            if attempt.previous().len() > 5 {
                return attempt.error("Too many download redirects");
            }
            if attempt.url().scheme() == "https"
                && matches!(
                    attempt.url().host_str(),
                    Some(
                        "github.com"
                            | "api.github.com"
                            | "release-assets.githubusercontent.com"
                            | "objects.githubusercontent.com"
                    )
                )
            {
                attempt.follow()
            } else {
                attempt.error("Unsupported download destination")
            }
        }))
        .build()
        .map_err(|_| "Could not prepare the secure download.")?;
    let release: serde_json::Value = client
        .get(RELEASE)
        .send()
        .await
        .map_err(|_| "Could not reach Herdr’s official release. Check your connection and retry.")?
        .error_for_status()
        .map_err(|_| "Herdr’s release service is unavailable. Try again later.")?
        .json()
        .await
        .map_err(|_| "Herdr’s release data could not be read.")?;
    if release["prerelease"] != false || release["draft"] != false {
        return Err("No stable Herdr release was available.".into());
    }
    let asset_name = if cfg!(target_arch = "aarch64") {
        "herdr-macos-aarch64"
    } else if cfg!(target_arch = "x86_64") {
        "herdr-macos-x86_64"
    } else {
        return Err("This Mac architecture is not supported by the installer.".into());
    };
    let asset = release["assets"]
        .as_array()
        .and_then(|assets| assets.iter().find(|a| a["name"] == asset_name))
        .ok_or("Herdr’s release has no download for this Mac.")?;
    let digest = asset["digest"]
        .as_str()
        .and_then(|d| d.strip_prefix("sha256:"))
        .filter(|d| d.len() == 64 && d.bytes().all(|b| b.is_ascii_hexdigit()))
        .ok_or(
            "The official release has no verifiable checksum. Use the installation guide instead.",
        )?;
    let tag = release["tag_name"]
        .as_str()
        .filter(|tag| {
            tag.starts_with('v')
                && tag
                    .chars()
                    .all(|c| c.is_ascii_alphanumeric() || ".-".contains(c))
        })
        .ok_or("Herdr’s release version is unsupported.")?;
    let expected_url =
        format!("https://github.com/herdrdev/herdr/releases/download/{tag}/{asset_name}");
    if asset["browser_download_url"] != expected_url {
        return Err("Herdr’s download address could not be verified.".into());
    }
    app.state::<Onboarding>().runtime().dependency = Dependency::new(
        "downloading",
        "Downloading Herdr’s official stable release…",
    );
    let mut response = client
        .get(expected_url)
        .send()
        .await
        .map_err(|_| "The Herdr download failed. Check your connection and retry.")?
        .error_for_status()
        .map_err(|_| "The Herdr download is unavailable.")?;
    if response.content_length().is_some_and(|n| n > LIMIT as u64) {
        return Err("The Herdr download is larger than expected.".into());
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|_| "The Herdr download was interrupted.")?
    {
        if bytes.len() + chunk.len() > LIMIT {
            return Err("The Herdr download is larger than expected.".into());
        }
        bytes.extend_from_slice(&chunk);
    }
    app.state::<Onboarding>().runtime().dependency =
        Dependency::new("verifying", "Verifying Herdr before installation…");
    if hex::encode(Sha256::digest(&bytes)) != digest.to_ascii_lowercase()
        || bytes.len() as u64 != asset["size"].as_u64().unwrap_or(0)
    {
        return Err("The Herdr download could not be verified. Nothing was installed. Retry or use the official guide.".into());
    }
    let home = std::env::var_os("HOME").ok_or("Your home folder is unavailable.")?;
    let directory = std::path::PathBuf::from(home).join(".local/bin");
    fs::create_dir_all(&directory)
        .map_err(|_| "Allow access to your local Applications folder, then retry.")?;
    let target = directory.join("herdr");
    let temporary = directory.join(format!(".herdr-{}", uuid::Uuid::new_v4()));
    let result = (|| {
        let mut options = fs::OpenOptions::new();
        options.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o700);
        }
        let mut file = options
            .open(&temporary)
            .map_err(|_| "Could not prepare Herdr installation.")?;
        file.write_all(&bytes)
            .and_then(|_| file.sync_all())
            .map_err(|_| "Could not write Herdr. Check available disk space.")?;
        // Atomic, no-overwrite admission; a concurrently installed tool is never replaced.
        fs::hard_link(&temporary, &target).map_err(|_| "Herdr was not installed: another installation exists or the folder is not writable. Check again.")?;
        Ok::<(), String>(())
    })();
    let _ = fs::remove_file(temporary);
    result?;
    let checked = tauri::async_runtime::spawn_blocking(dependency::check)
        .await
        .map_err(|_| "Herdr was installed but its readiness check failed.")?;
    app.state::<Onboarding>().runtime().dependency = checked;
    Ok(())
}
