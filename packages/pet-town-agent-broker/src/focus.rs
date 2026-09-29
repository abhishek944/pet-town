use crate::{command, herdr, FocusRoute};
use serde::Deserialize;
use std::ffi::OsString;

#[derive(Deserialize)]
struct AgentGetEnvelope {
    result: AgentGetResult,
}
#[derive(Deserialize)]
struct AgentGetResult {
    agent: CurrentAgent,
}
#[derive(Deserialize)]
struct CurrentAgent {
    agent_session: Option<CurrentSession>,
    tab_id: String,
    workspace_id: String,
}
#[derive(Deserialize)]
struct CurrentSession {
    value: String,
}
#[derive(PartialEq, Eq)]
struct VerifiedAgent {
    tab_id: String,
    workspace_id: String,
}

fn verify(
    binary: &OsString,
    pane_id: &str,
    socket: Option<&str>,
    expected_session: &str,
) -> Result<VerifiedAgent, String> {
    let arguments = vec!["agent".to_string(), "get".to_string(), pane_id.to_string()];
    let text = command::run(binary, socket, &arguments)
        .ok_or_else(|| "agent is no longer available".to_string())?;
    let current = serde_json::from_str::<AgentGetEnvelope>(&text)
        .map_err(|_| "Herdr returned invalid agent details".to_string())?
        .result
        .agent;
    let current_session = current.agent_session.map(|session| session.value);
    let ephemeral = expected_session == format!("ephemeral:{pane_id}") && current_session.is_none();
    if !ephemeral && current_session.as_deref() != Some(expected_session) {
        return Err("agent changed since the latest poll".to_string());
    }
    Ok(VerifiedAgent {
        tab_id: current.tab_id,
        workspace_id: current.workspace_id,
    })
}

fn focus_target(
    binary: &OsString,
    socket: Option<&str>,
    kind: &str,
    id: &str,
    error: &str,
) -> Result<(), String> {
    let arguments = vec![kind.to_string(), "focus".to_string(), id.to_string()];
    command::run(binary, socket, &arguments)
        .map(|_| ())
        .ok_or_else(|| error.to_string())
}

fn focus_herdr(pane_id: &str, socket: Option<&str>, expected_session: &str) -> Result<(), String> {
    let binary = herdr::binary();
    let verified = verify(&binary, pane_id, socket, expected_session)?;
    focus_target(
        &binary,
        socket,
        "workspace",
        &verified.workspace_id,
        "Herdr could not focus that workspace",
    )?;
    focus_target(
        &binary,
        socket,
        "tab",
        &verified.tab_id,
        "Herdr could not focus that tab",
    )?;
    if verify(&binary, pane_id, socket, expected_session)? != verified {
        return Err("agent moved while focus was in progress".to_string());
    }
    focus_target(
        &binary,
        socket,
        "agent",
        pane_id,
        "Herdr could not focus that agent",
    )?;
    #[cfg(target_os = "macos")]
    let _ = crate::macos_activation::activate(&binary, socket);
    Ok(())
}

pub fn focus_route(route: &FocusRoute) -> Result<(), String> {
    focus_route_with_codex_activation(route).map(|_| ())
}
/// Returns whether Codex Desktop itself was activated (rather than a fallback app).
pub fn focus_route_with_codex_activation(route: &FocusRoute) -> Result<bool, String> {
    match route {
        FocusRoute::Herdr {
            pane_id,
            socket,
            agent_session_id,
        } => focus_herdr(pane_id, socket.as_deref(), agent_session_id).map(|_| false),
        FocusRoute::Application { bundle_id } => activate_application(bundle_id).map(|_| false),
        FocusRoute::Codex {
            thread_id,
            fallback_bundle_id,
        } => focus_codex(thread_id.as_deref(), fallback_bundle_id.as_deref()),
    }
}

#[cfg(target_os = "macos")]
fn focus_codex(thread_id: Option<&str>, fallback: Option<&str>) -> Result<bool, String> {
    if let Ok(application_path) = activate_application("com.openai.codex") {
        if let Some(id) = thread_id.filter(|id| valid_codex_thread(id)) {
            let application_path = application_path.ok_or("Codex's bundle path is unavailable")?;
            let url = format!("codex://threads/{id}");
            let opened = std::process::Command::new("/usr/bin/open")
                .args(["-a", &application_path, &url])
                .status()
                .map_err(|error| error.to_string())?;
            if !opened.success() {
                return Err("Codex could not open this local conversation".into());
            }
        }
        return Ok(true);
    }
    fallback
        .map_or_else(|| Err("Codex is not running".into()), activate_application)
        .map(|_| false)
}

fn valid_codex_thread(id: &str) -> bool {
    let bytes = id.as_bytes();
    bytes.len() == 36
        && bytes.iter().enumerate().all(|(index, byte)| {
            if [8, 13, 18, 23].contains(&index) {
                *byte == b'-'
            } else {
                byte.is_ascii_hexdigit()
            }
        })
}

#[cfg(not(target_os = "macos"))]
fn focus_codex(_thread_id: Option<&str>, _fallback: Option<&str>) -> Result<bool, String> {
    Err("Codex focus is unavailable on this platform".into())
}

#[cfg(not(target_os = "macos"))]
fn activate_application(_bundle_id: &str) -> Result<Option<String>, String> {
    Err("application focus is unavailable on this platform".to_string())
}

#[cfg(target_os = "macos")]
fn activate_application(bundle_id: &str) -> Result<Option<String>, String> {
    use objc2_app_kit::{NSApplicationActivationOptions, NSRunningApplication};
    use std::process::Command;

    let output = Command::new("/bin/ps")
        .env_remove("OPENAI_API_KEY")
        .args(["-axo", "pid="])
        .output()
        .map_err(|_| "could not inspect running applications".to_string())?;
    if !output.status.success() || output.stdout.len() > 1024 * 1024 {
        return Err("could not inspect running applications".to_string());
    }
    for pid in String::from_utf8_lossy(&output.stdout)
        .lines()
        .filter_map(|line| line.trim().parse().ok())
    {
        let Some(application) = NSRunningApplication::runningApplicationWithProcessIdentifier(pid)
        else {
            continue;
        };
        if application
            .bundleIdentifier()
            .is_none_or(|identifier| identifier.to_string() != bundle_id)
        {
            continue;
        }
        // Preserve the running installation when apps share a bundle ID.
        let path = application
            .bundleURL()
            .and_then(|url| url.path())
            .map(|path| path.to_string());
        application.unhide();
        return application
            .activateWithOptions(NSApplicationActivationOptions::ActivateAllWindows)
            .then_some(path)
            .ok_or_else(|| "macOS refused to activate the agent application".to_string());
    }
    Err("the agent application is not running".to_string())
}
