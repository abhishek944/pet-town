use serde_json::Value;
use std::ffi::OsString;
use std::process::{Command, Stdio};
use std::time::Duration;
use wait_timeout::ChildExt;

const MAX_OUTPUT: u64 = 4 * 1024 * 1024;

pub(crate) fn binary() -> OsString {
    if let Some(path) =
        std::env::var_os("PET_TOWN_HERDR_BIN").or_else(|| std::env::var_os("HERDR_BIN_PATH"))
    {
        return path;
    }
    let mut candidates = vec![
        "/opt/homebrew/bin/herdr".into(),
        "/opt/homebrew/opt/herdr/bin/herdr".into(),
        "/usr/local/bin/herdr".into(),
        "/Applications/Herdr.app/Contents/MacOS/herdr".into(),
    ];
    if let Some(home) = std::env::var_os("HOME") {
        candidates.push(std::path::PathBuf::from(&home).join(".local/bin/herdr"));
        candidates.push(std::path::PathBuf::from(home).join(".cargo/bin/herdr"));
    }
    candidates
        .into_iter()
        .find(|path| path.is_file())
        .map(OsString::from)
        .unwrap_or_else(|| "herdr".into())
}

fn output(arguments: &[String], timeout: Duration) -> Result<Vec<u8>, String> {
    let mut process = Command::new(binary());
    process
        .args(arguments)
        .env_remove("OPENAI_API_KEY")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        process.process_group(0);
    }
    let mut child = process
        .spawn()
        .map_err(|_| "Herdr is not installed or could not be started.".to_string())?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Herdr output was unavailable.".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Herdr error output was unavailable.".to_string())?;
    let reader = super::herdr_io::read_stream(stdout, MAX_OUTPUT);
    let error_reader = super::herdr_io::read_stream(stderr, MAX_OUTPUT);
    let status = child
        .wait_timeout(timeout)
        .map_err(|_| "Could not wait for Herdr.")?;
    if status.is_none() {
        #[cfg(unix)]
        unsafe {
            let _ = libc::kill(-(child.id() as i32), libc::SIGTERM);
        }
        let _ = child.kill();
        let _ = child.wait();
        return Err("Herdr did not finish in time.".into());
    }
    let bytes = reader
        .join()
        .map_err(|_| "Could not collect Herdr output.".to_string())?
        .map_err(|_| "Could not read Herdr output.".to_string())?;
    let error_bytes = error_reader
        .join()
        .map_err(|_| "Could not collect Herdr errors.".to_string())?
        .map_err(|_| "Could not read Herdr errors.".to_string())?;
    if bytes.len() as u64 > MAX_OUTPUT || error_bytes.len() as u64 > MAX_OUTPUT {
        return Err("Herdr returned too much output.".into());
    }
    if !status.is_some_and(|value| value.success()) {
        let detail = String::from_utf8_lossy(&error_bytes).to_ascii_lowercase();
        if detail.contains("agent_not_found") || detail.contains("tab_not_found") {
            return Err("Herdr target not found.".into());
        }
        if let Ok(value) = serde_json::from_slice::<Value>(&error_bytes) {
            if let (Some(code), Some(message)) = (
                value["error"]["code"].as_str(),
                value["error"]["message"].as_str(),
            ) {
                return Err(format!("Herdr {code}: {message}"));
            }
        }
        return Err("Herdr rejected the orchestrator operation.".into());
    }
    Ok(bytes)
}

pub fn command(arguments: &[String], timeout: Duration) -> Result<Value, String> {
    serde_json::from_slice(&output(arguments, timeout)?)
        .map_err(|_| "Herdr returned invalid data.".to_string())
}

pub fn text(arguments: &[String], timeout: Duration) -> Result<String, String> {
    String::from_utf8(output(arguments, timeout)?)
        .map_err(|_| "Herdr returned invalid text.".to_string())
}
