use crate::herdr_command::run_herdr_command;
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
    agent_session: Option<CurrentAgentSession>,
    tab_id: String,
    workspace_id: String,
}

#[derive(Deserialize)]
struct CurrentAgentSession {
    value: String,
}

pub(super) fn verify_from_environment(pane_id: &str) -> Result<(), String> {
    let expected = std::env::var("PET_TOWN_EXPECTED_AGENT_SESSION")
        .map_err(|_| "expected agent session is unavailable".to_string())?;
    let socket = std::env::var("HERDR_SOCKET_PATH").ok();
    let binary = std::env::var_os("PET_TOWN_HERDR_BIN")
        .or_else(|| std::env::var_os("HERDR_BIN_PATH"))
        .unwrap_or_else(|| "herdr".into());
    focus(&binary, pane_id, socket.as_deref(), &expected)
}

#[derive(PartialEq, Eq)]
pub(super) struct VerifiedAgent {
    tab_id: String,
    workspace_id: String,
}

pub(super) fn verify(
    herdr: &OsString,
    pane_id: &str,
    socket: Option<&str>,
    expected_session: &str,
) -> Result<VerifiedAgent, String> {
    let arguments = vec!["agent".to_string(), "get".to_string(), pane_id.to_string()];
    let text = run_herdr_command(herdr, socket, &arguments)
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

fn focus_command(
    herdr: &OsString,
    socket: Option<&str>,
    arguments: Vec<String>,
    error: &str,
) -> Result<(), String> {
    run_herdr_command(herdr, socket, &arguments)
        .map(|_| ())
        .ok_or_else(|| error.to_string())
}

pub(super) fn focus_verified(
    herdr: &OsString,
    pane_id: &str,
    socket: Option<&str>,
    expected_session: &str,
    verified: &VerifiedAgent,
) -> Result<(), String> {
    focus_command(
        herdr,
        socket,
        vec![
            "workspace".to_string(),
            "focus".to_string(),
            verified.workspace_id.clone(),
        ],
        "Herdr could not focus that workspace",
    )?;
    focus_command(
        herdr,
        socket,
        vec![
            "tab".to_string(),
            "focus".to_string(),
            verified.tab_id.clone(),
        ],
        "Herdr could not focus that tab",
    )?;
    if verify(herdr, pane_id, socket, expected_session)? != *verified {
        return Err("agent moved while focus was in progress".to_string());
    }
    focus_command(
        herdr,
        socket,
        vec![
            "agent".to_string(),
            "focus".to_string(),
            pane_id.to_string(),
        ],
        "Herdr could not focus that agent",
    )
}

pub(super) fn focus(
    herdr: &OsString,
    pane_id: &str,
    socket: Option<&str>,
    expected_session: &str,
) -> Result<(), String> {
    let verified = verify(herdr, pane_id, socket, expected_session)?;
    focus_verified(herdr, pane_id, socket, expected_session, &verified)
}
