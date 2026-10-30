//! Bounded Core/app subprocess transport; never translate legacy TUI commands.
use serde_json::{json, Value};
use std::ffi::{OsStr, OsString};
use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::Duration;

pub(crate) fn binary(app: bool) -> OsString {
    let (key, name) = if app {
        ("PET_TOWN_HERDR_APP_BIN", "herdr-app")
    } else {
        ("PET_TOWN_HC_BIN", "hc")
    };
    if let Some(path) = std::env::var_os(key) {
        return path;
    }
    let executable = if cfg!(windows) {
        format!("{name}.exe")
    } else {
        name.into()
    };
    let mut paths = Vec::new();
    if let Some(home) = std::env::var_os("HOME") {
        paths.push(PathBuf::from(&home).join(".local/bin").join(&executable));
        if app {
            paths.push(PathBuf::from(home).join("Applications/Herdr.app/Contents/MacOS/herdr-app"));
        }
    }
    for directory in ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"] {
        paths.push(PathBuf::from(directory).join(&executable));
    }
    paths
        .into_iter()
        .find(|path| path.is_file())
        .map(OsString::from)
        .unwrap_or_else(|| executable.into())
}

pub(crate) fn execute(binary: &OsStr, args: &[&str], input: Option<&[u8]>) -> Option<String> {
    // Only small, internally constructed RPC requests are written before reading.
    if input.is_some_and(|bytes| bytes.len() > 4096) {
        return None;
    }
    let mut command = Command::new(binary);
    command
        .args(args)
        .env_remove("OPENAI_API_KEY")
        .env_remove("HC_TERMINAL_ID")
        .stdin(if input.is_some() {
            Stdio::piped()
        } else {
            Stdio::null()
        })
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.process_group(0);
    }
    let mut child = command.spawn().ok()?;
    if let Some(bytes) = input {
        let written = child
            .stdin
            .take()
            .is_some_and(|mut stdin| stdin.write_all(bytes).is_ok());
        if !written {
            let _ = child.kill();
            let _ = child.wait();
            return None;
        }
    }
    let stdout = child.stdout.take()?;
    // Core's federated list can wait three seconds for a slow remote before
    // returning healthy local records. Let that existing fallback finish.
    let timeout = Duration::from_secs(if input.is_some() { 5 } else { 2 });
    let (status, bytes) = crate::command::collect_output(&mut child, stdout, timeout, None)?;
    status
        .success()
        .then(|| String::from_utf8(bytes).ok())
        .flatten()
}

pub(crate) fn rpc(calls: &[(&str, Value)]) -> Option<Vec<Value>> {
    let binary = binary(false);
    // Core owns connection/startup; never install, update or restart it here.
    let mut input = Vec::new();
    for (index, (method, params)) in calls.iter().enumerate() {
        serde_json::to_writer(
            &mut input,
            &json!({
                "jsonrpc":"2.0", "id":index, "method":method, "params":params
            }),
        )
        .ok()?;
        input.push(b'\n');
    }
    let output = execute(&binary, &["connect"], Some(&input))?;
    let mut results = vec![None; calls.len()];
    for line in output.lines() {
        let reply: Value = serde_json::from_str(line).ok()?;
        let index = usize::try_from(reply["id"].as_u64()?).ok()?;
        let slot = results.get_mut(index)?;
        if slot.is_some() || reply.get("error").is_some() || reply["jsonrpc"] != "2.0" {
            return None;
        }
        *slot = Some(reply.get("result")?.clone());
    }
    results.into_iter().collect()
}

pub(crate) fn select(terminal: &str) -> Result<(), String> {
    crate::core_app::verify_context()?;
    let output = execute(
        &binary(true),
        &["do", "agent.focus", "--terminal", terminal],
        None,
    )
    .ok_or("The existing Herdr app is unavailable. Open it to focus this Core agent.")?;
    let value: Value =
        serde_json::from_str(&output).map_err(|_| "Herdr app returned invalid focus details.")?;
    if value["ok"] != true || value.get("error").is_some() {
        return Err("Herdr app could not show this Core agent.".into());
    }
    Ok(())
}
