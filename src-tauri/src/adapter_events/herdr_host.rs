use crate::focus::herdr_owner_key;
use crate::herdr_command::run_herdr_command;
use serde::Deserialize;
use std::ffi::OsString;

#[derive(Deserialize)]
struct AgentGetEnvelope {
    result: AgentGetResult,
}

#[derive(Deserialize)]
struct AgentGetResult {
    agent: HostedAgent,
}

#[derive(Deserialize)]
struct HostedAgent {
    pane_id: String,
    agent_session: Option<HostedAgentSession>,
}

#[derive(Deserialize)]
struct HostedAgentSession {
    value: String,
}

fn herdr_binary() -> OsString {
    std::env::var_os("PET_VILLAGE_HERDR_BIN")
        .or_else(|| std::env::var_os("HERDR_BIN_PATH"))
        .unwrap_or_else(|| "herdr".into())
}

pub(super) fn owner_key(native_session: &str) -> Option<String> {
    if std::env::var("HERDR_ENV").ok().as_deref() != Some("1") {
        return None;
    }
    let hinted_pane = std::env::var("HERDR_PANE_ID").ok()?;
    let socket = std::env::var("HERDR_SOCKET_PATH").ok();
    let arguments = vec!["agent".to_string(), "get".to_string(), hinted_pane];
    let response = run_herdr_command(&herdr_binary(), socket.as_deref(), &arguments)?;
    let agent = serde_json::from_str::<AgentGetEnvelope>(&response)
        .ok()?
        .result
        .agent;
    let incarnation = agent.agent_session?.value;
    if incarnation != native_session {
        return None;
    }
    let _canonical_pane = agent.pane_id;
    Some(herdr_owner_key(socket.as_deref(), &incarnation))
}
