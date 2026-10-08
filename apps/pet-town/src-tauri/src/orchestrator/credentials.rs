use tauri::{AppHandle, Manager};

const SERVICE: &str = "pet-town.openai";
const ACCOUNT: &str = "api-key";
#[cfg(target_os = "macos")]
static OPENAI_KEY_CACHE: std::sync::Mutex<Option<String>> = std::sync::Mutex::new(None);

pub fn keychain_key() -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        let mut cached = OPENAI_KEY_CACHE
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        if let Some(value) = cached.as_ref() {
            return Some(value.clone());
        }
        let bytes = security_framework::passwords::get_generic_password(SERVICE, ACCOUNT).ok()?;
        let value = String::from_utf8(bytes).ok()?;
        if value.trim().is_empty() {
            return None;
        }
        *cached = Some(value.clone());
        Some(value)
    }
    #[cfg(not(target_os = "macos"))]
    None
}

#[tauri::command]
pub fn openai_key_source() -> &'static str {
    if keychain_key().is_some() {
        "keychain"
    } else if std::env::var("OPENAI_API_KEY").is_ok_and(|key| !key.trim().is_empty()) {
        "environment"
    } else {
        "missing"
    }
}

#[tauri::command]
pub fn save_openai_key(key: String, app: AppHandle) -> Result<(), String> {
    let key = key.trim();
    if key.is_empty() || key.len() > 4096 || key.chars().any(char::is_control) {
        return Err("Enter a valid OpenAI API key.".into());
    }
    #[cfg(target_os = "macos")]
    {
        security_framework::passwords::set_generic_password(SERVICE, ACCOUNT, key.as_bytes())
            .map_err(|_| "Could not save the key in macOS Keychain.".to_string())?;
        *OPENAI_KEY_CACHE
            .lock()
            .unwrap_or_else(|error| error.into_inner()) = Some(key.to_string());
    }
    #[cfg(not(target_os = "macos"))]
    return Err("Keychain storage is available on macOS only.".into());
    app.state::<super::state::OrchestratorState>().emit(&app);
    Ok(())
}

#[tauri::command]
pub async fn import_openai_key_from_shell(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let key = tauri::async_runtime::spawn_blocking(shell_key)
            .await
            .map_err(|_| "Could not read the shell key.".to_string())??;
        save_openai_key(key, app)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Err("Shell import is available on macOS only.".into())
    }
}

#[cfg(target_os = "macos")]
fn shell_key() -> Result<String, String> {
    const MARKER: &[u8] = b"\0PET_TOWN_OPENAI_KEY\0";
    let output = std::process::Command::new("/bin/zsh")
        .env_remove("OPENAI_API_KEY")
        .args([
            "-ic",
            "printf '\\0PET_TOWN_OPENAI_KEY\\0%s\\0' \"${OPENAI_API_KEY-}\"",
        ])
        .stderr(std::process::Stdio::null())
        .output()
        .map_err(|_| "Could not open your shell settings.".to_string())?;
    if !output.status.success() {
        return Err("Could not read your shell settings.".into());
    }
    let start = output
        .stdout
        .windows(MARKER.len())
        .rposition(|part| part == MARKER)
        .ok_or_else(|| "Could not find an OpenAI API key in your shell settings.".to_string())?;
    let value = &output.stdout[start + MARKER.len()..];
    let end = value
        .iter()
        .position(|byte| *byte == 0)
        .unwrap_or(value.len());
    let key = String::from_utf8(value[..end].to_vec())
        .map_err(|_| "The shell key could not be read.".to_string())?;
    if key.trim().is_empty() {
        return Err("No OpenAI API key was found in ~/.zshrc.".into());
    }
    Ok(key)
}
