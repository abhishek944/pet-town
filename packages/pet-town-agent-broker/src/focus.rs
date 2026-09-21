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

fn command_ok(
    binary: &OsString,
    socket: Option<&str>,
    arguments: Vec<String>,
    error: &str,
) -> Result<(), String> {
    command::run(binary, socket, &arguments)
        .map(|_| ())
        .ok_or_else(|| error.to_string())
}

fn focus_herdr(pane_id: &str, socket: Option<&str>, expected_session: &str) -> Result<(), String> {
    let binary = herdr::binary();
    let verified = verify(&binary, pane_id, socket, expected_session)?;
    command_ok(
        &binary,
        socket,
        vec![
            "workspace".to_string(),
            "focus".to_string(),
            verified.workspace_id.clone(),
        ],
        "Herdr could not focus that workspace",
    )?;
    command_ok(
        &binary,
        socket,
        vec![
            "tab".to_string(),
            "focus".to_string(),
            verified.tab_id.clone(),
        ],
        "Herdr could not focus that tab",
    )?;
    if verify(&binary, pane_id, socket, expected_session)? != verified {
        return Err("agent moved while focus was in progress".to_string());
    }
    command_ok(
        &binary,
        socket,
        vec![
            "agent".to_string(),
            "focus".to_string(),
            pane_id.to_string(),
        ],
        "Herdr could not focus that agent",
    )?;
    #[cfg(target_os = "macos")]
    let _ = crate::macos_activation::activate(&binary, socket);
    Ok(())
}

pub fn focus_route(route: &FocusRoute) -> Result<(), String> {
    match route {
        FocusRoute::Herdr {
            pane_id,
            socket,
            agent_session_id,
        } => focus_herdr(pane_id, socket.as_deref(), agent_session_id),
        FocusRoute::Application { bundle_id } => activate_application(bundle_id),
    }
}

#[cfg(not(target_os = "macos"))]
fn activate_application(_bundle_id: &str) -> Result<(), String> {
    Err("application focus is unavailable on this platform".to_string())
}

#[cfg(target_os = "macos")]
fn activate_application(bundle_id: &str) -> Result<(), String> {
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
        application.unhide();
        return application
            .activateWithOptions(NSApplicationActivationOptions::ActivateAllWindows)
            .then_some(())
            .ok_or_else(|| "macOS refused to activate the agent application".to_string());
    }
    Err("the agent application is not running".to_string())
}
