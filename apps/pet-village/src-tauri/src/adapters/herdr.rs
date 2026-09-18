use super::{AdapterAgent, AdapterSnapshot, AgentAdapter};
use crate::agents::parse_agent_list;
use crate::focus::{herdr_owner_key, public_agent_id, FocusRoute};
use crate::herdr_command::run_herdr_command;
use crate::labels::labels_for_session;
use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};

const MAX_CONCURRENT_SESSION_QUERIES: usize = 8;

pub(crate) struct HerdrAdapter;

fn herdr_binary() -> OsString {
    crate::orchestrator::herdr_binary()
}

fn registered_sessions() -> Vec<Option<String>> {
    let Some(directory) = std::env::var_os("PET_VILLAGE_SESSION_REGISTRY") else {
        return vec![std::env::var("HERDR_SOCKET_PATH").ok()];
    };
    let mut paths: Vec<PathBuf> = match fs::read_dir(directory) {
        Ok(entries) => entries
            .filter_map(|entry| entry.ok().map(|item| item.path()))
            .collect(),
        Err(_) => return vec![None],
    };
    paths.sort();

    let mut sockets: Vec<String> = paths
        .into_iter()
        .filter_map(|path| fs::read_to_string(path).ok())
        .map(|socket| socket.trim().to_string())
        .filter(|socket| !socket.is_empty() && Path::new(socket).exists())
        .collect();
    sockets.sort();
    sockets.dedup();

    if sockets.is_empty() {
        vec![None]
    } else {
        sockets.into_iter().map(Some).collect()
    }
}

fn query_session(herdr: &OsString, socket: Option<String>) -> Option<Vec<AdapterAgent>> {
    let arguments = vec!["agent".to_string(), "list".to_string()];
    let text = run_herdr_command(herdr, socket.as_deref(), &arguments)?;
    let parsed = parse_agent_list(&text).ok()?;
    let mut workspaces: Vec<String> = parsed
        .iter()
        .filter_map(|agent| agent.workspace_id.clone())
        .collect();
    workspaces.sort();
    workspaces.dedup();
    let labels = labels_for_session(herdr, socket.as_deref(), &workspaces);

    Some(
        parsed
            .into_iter()
            .map(|mut agent| {
                agent.view.label = labels
                    .pane_labels
                    .get(&agent.view.id)
                    .cloned()
                    .or_else(|| {
                        agent
                            .tab_id
                            .as_ref()
                            .and_then(|id| labels.tab_fallback_labels.get(id).cloned())
                    })
                    .unwrap_or_else(|| agent.view.label.clone());
                let pane_id = agent.view.id.clone();
                let agent_session_id = agent
                    .agent_session_id
                    .unwrap_or_else(|| format!("ephemeral:{pane_id}"));
                let public_id = public_agent_id(socket.as_deref(), &agent_session_id);
                let owner_key = herdr_owner_key(socket.as_deref(), &agent_session_id);
                let focus_route = Some(FocusRoute::Herdr {
                    pane_id,
                    socket: socket.clone(),
                    agent_session_id,
                });
                agent.view.id = public_id;
                agent.view.source = "herdr".to_string();
                AdapterAgent {
                    owner_key,
                    hosted_owner_key: None,
                    view: agent.view,
                    focus_route,
                }
            })
            .collect(),
    )
}

impl AgentAdapter for HerdrAdapter {
    fn snapshot(&self) -> AdapterSnapshot {
        let herdr = herdr_binary();
        let sessions = registered_sessions();
        let mut available = false;
        let mut agents = Vec::new();
        for batch in sessions.chunks(MAX_CONCURRENT_SESSION_QUERIES) {
            let workers: Vec<_> = batch
                .iter()
                .cloned()
                .map(|socket| {
                    let herdr = herdr.clone();
                    std::thread::spawn(move || query_session(&herdr, socket))
                })
                .collect();
            for worker in workers {
                if let Ok(Some(mut session_agents)) = worker.join() {
                    available = true;
                    agents.append(&mut session_agents);
                }
            }
        }
        agents.sort_by(|left, right| left.view.id.cmp(&right.view.id));
        agents.dedup_by(|left, right| left.owner_key == right.owner_key);
        AdapterSnapshot { available, agents }
    }
}
