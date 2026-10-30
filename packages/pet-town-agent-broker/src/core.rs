//! Herdr Core is a terminal host, separate from the legacy TUI adapter.
use crate::{
    agents::safe_display_label, core_app, core_io, AdapterAgent, AdapterSnapshot, FocusRoute,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::Path;

/// Private destination: a live program incarnation, not a native harness session.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct CoreTarget {
    core_id: String,
    terminal: String,
    created_ms: u64,
    pid: u32,
}
#[derive(Deserialize)]
struct Terminal {
    address: String,
    state: String,
    created_ms: u64,
    pid: Option<u32>,
    status: Option<Status>,
    name: Option<String>,
    cwd: String,
}
#[derive(Deserialize)]
struct Status {
    state: String,
}
fn component(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 128
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"._-".contains(&byte))
}
fn address(value: &str) -> bool {
    let (machine, terminal) = value
        .split_once('/')
        .map_or((None, value), |(m, t)| (Some(m), t));
    machine.is_none_or(component)
        && terminal.strip_prefix('t').is_some_and(|id| {
            !id.is_empty()
                && id.len() <= 32
                && id
                    .bytes()
                    .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit())
        })
}
fn identity(hello: &Value, machines: &Value, terminal: &Terminal) -> Option<CoreTarget> {
    if !address(&terminal.address)
        || terminal.state != "live"
        || terminal.status.as_ref()?.state.is_empty()
    {
        return None;
    }
    let core_id = if let Some((machine, _)) = terminal.address.split_once('/') {
        machines["machines"]
            .as_array()?
            .iter()
            .find(|item| item["name"] == machine && item["state"] == "connected")?["id"]
            .as_str()?
    } else {
        hello["core"]["id"].as_str()?
    };
    let pid = terminal.pid.filter(|pid| *pid > 0)?;
    component(core_id).then(|| CoreTarget {
        core_id: core_id.into(),
        terminal: terminal.address.clone(),
        created_ms: terminal.created_ms,
        pid,
    })
}
impl CoreTarget {
    fn suffix(&self) -> String {
        let terminal = self.terminal.rsplit('/').next().unwrap_or_default();
        let encoded = serde_json::to_string(&(&self.core_id, terminal, self.created_ms, self.pid))
            .expect("Core identity is serializable");
        crate::herdr::opaque(&encoded)
    }

    pub(crate) fn owner_key(&self) -> String {
        format!("herdr-core-program:{}", self.suffix())
    }
    fn public_id(&self) -> String {
        format!("herdr-core:{}", self.suffix())
    }
    pub(crate) fn local_pid(&self) -> Option<u32> {
        (!self.terminal.contains('/')).then_some(self.pid)
    }
}

fn query(terminal: Option<&str>) -> Option<Vec<(Terminal, CoreTarget)>> {
    let call = terminal.map_or(("terminal.list", json!({})), |id| {
        ("terminal.get", json!({"terminal":id}))
    });
    let results = core_io::rpc(&[
        ("hello", json!({"generation":1})),
        call,
        ("machine.list", json!({})),
    ])?;
    if results[0]["generation"] != 1 {
        return None;
    }
    let terminals: Vec<Terminal> = if terminal.is_some() {
        vec![serde_json::from_value(results[1].clone()).ok()?]
    } else {
        serde_json::from_value(results[1]["terminals"].clone()).ok()?
    };
    Some(
        terminals
            .into_iter()
            .filter_map(|record| {
                let target = identity(&results[0], &results[2], &record)?;
                Some((record, target))
            })
            .collect(),
    )
}

pub(crate) fn current(terminal: &str) -> Option<CoreTarget> {
    if !address(terminal) {
        return None;
    }
    query(Some(terminal))?
        .into_iter()
        .find(|(_, target)| target.terminal == terminal)
        .map(|(_, target)| target)
}

pub(crate) fn snapshot() -> AdapterSnapshot {
    let Some(records) = query(None) else {
        return AdapterSnapshot {
            available: false,
            agents: Vec::new(),
        };
    };
    let presentation = core_app::snapshot();
    let agents = records
        .into_iter()
        .map(|(terminal, target)| {
            let status = match terminal.status.as_ref().map(|s| s.state.as_str()) {
                Some(status @ ("idle" | "working" | "done" | "blocked")) => status,
                Some("error") => "blocked", // Existing attention state.
                _ => "unknown",
            };
            let project = Path::new(&terminal.cwd)
                .file_name()
                .and_then(|name| name.to_str());
            let machine = terminal.address.split_once('/').map(|(machine, _)| machine);
            let label = presentation
                .label(&terminal.address)
                .map(str::to_string)
                .or_else(|| safe_display_label(terminal.name.as_deref()))
                .or_else(|| safe_display_label(project))
                .unwrap_or_else(|| "Core agent".into());
            AdapterAgent {
                owner_key: target.owner_key(),
                hosted_owner_key: None,
                view: crate::AgentView {
                    id: target.public_id(),
                    status: presentation.status(&terminal.address, status).into(),
                    label: machine.map_or_else(|| label.clone(), |m| format!("{m}: {label}")),
                    source: "herdr-core".into(),
                    ..crate::AgentView::default()
                },
                // Core remote focus is handled by the app, not the TUI's manual
                // machine-selection flow. Terminal/Observe remain unsupported.
                focus_route: Some(FocusRoute::HerdrCore { target }),
            }
        })
        .collect();
    AdapterSnapshot {
        available: true,
        agents,
    }
}

pub(crate) fn resolve(id: &str) -> Option<FocusRoute> {
    if !id.starts_with("herdr-core:") || id.len() > 64 {
        return None;
    }
    let (_, target) = query(None)?
        .into_iter()
        .find(|(_, target)| target.public_id() == id)?;
    Some(FocusRoute::HerdrCore { target })
}

pub(crate) fn focus(target: &CoreTarget) -> Result<(), String> {
    let verify = || {
        (current(&target.terminal).as_ref() == Some(target))
            .then_some(())
            .ok_or_else(|| "This Core agent ended or changed. Choose its current pet.".to_string())
    };
    verify()?;
    core_io::select(&target.terminal)?;
    verify()
}
