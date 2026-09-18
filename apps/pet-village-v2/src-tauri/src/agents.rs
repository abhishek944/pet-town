use crate::focus_targets::FocusTargets;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Read;
use std::path::PathBuf;
use std::process::{Child, Command, ExitStatus, Stdio};
use std::thread;
use std::time::{Duration, Instant};

const BRIDGE_TIMEOUT: Duration = Duration::from_secs(20);
const MAX_SNAPSHOT_BYTES: u64 = 1_048_576;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AgentView {
    pub(crate) id: String,
    name: String,
    state: String,
    pet_id: String,
    detail: Option<String>,
    pub(crate) focus_target: Option<String>,
}

#[derive(Debug, Deserialize)]
struct LegacyAgentView {
    id: String,
    status: String,
    label: String,
    source: String,
}

fn valid_state(state: &str) -> bool {
    matches!(state, "working" | "blocked" | "done" | "idle" | "unknown")
}

fn validate(agents: Vec<AgentView>) -> Vec<AgentView> {
    agents
        .into_iter()
        .filter(|agent| !agent.id.is_empty() && !agent.name.is_empty() && valid_state(&agent.state))
        .collect()
}

fn pet_for(_id: &str) -> String {
    "plum-dragon".to_string()
}

fn bridge_binary() -> Option<PathBuf> {
    if let Some(binary) = std::env::var_os("PET_VILLAGE_V1_BIN") {
        return Some(PathBuf::from(binary));
    }
    let mut candidates = Vec::new();
    if let Ok(executable) = std::env::current_exe() {
        if let Some(directory) = executable.parent() {
            candidates.push(directory.join("pet-village"));
        }
    }
    #[cfg(target_arch = "aarch64")]
    let target = "aarch64-apple-darwin";
    #[cfg(target_arch = "x86_64")]
    let target = "x86_64-apple-darwin";
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let apps = manifest.parent()?.parent()?;
    let v1_target = apps.join("pet-village/src-tauri/target");
    candidates.push(v1_target.join(target).join("release/pet-village"));
    candidates.push(v1_target.join("debug/pet-village"));
    candidates.into_iter().find(|candidate| candidate.is_file())
}

fn wait_for_bridge(child: &mut Child) -> Result<ExitStatus, String> {
    let deadline = Instant::now() + BRIDGE_TIMEOUT;
    loop {
        if let Some(status) = child.try_wait().map_err(|error| error.to_string())? {
            return Ok(status);
        }
        if Instant::now() >= deadline {
            let _ = child.kill();
            let _ = child.wait();
            return Err("v1 bridge timed out".to_string());
        }
        thread::sleep(Duration::from_millis(20));
    }
}

fn from_v1_bridge() -> Option<Vec<AgentView>> {
    let mut child = Command::new(bridge_binary()?)
        .arg("--snapshot")
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .ok()?;
    let stdout = child.stdout.take()?;
    let reader = thread::spawn(move || {
        let mut bytes = Vec::new();
        stdout
            .take(MAX_SNAPSHOT_BYTES + 1)
            .read_to_end(&mut bytes)
            .ok()?;
        Some(bytes)
    });
    let status = wait_for_bridge(&mut child).ok()?;
    let bytes = reader.join().ok()??;
    if !status.success() || bytes.len() as u64 > MAX_SNAPSHOT_BYTES {
        return None;
    }
    let value: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    let targets = value
        .get("focusTargets")
        .and_then(serde_json::Value::as_object);
    let legacy: Vec<LegacyAgentView> = serde_json::from_value(value.get("agents")?.clone()).ok()?;
    Some(validate(
        legacy
            .into_iter()
            .map(|agent| {
                let focus_target = targets
                    .and_then(|routes| routes.get(&agent.id))
                    .map(serde_json::Value::to_string);
                AgentView {
                    pet_id: pet_for(&agent.id),
                    id: agent.id,
                    name: agent.label,
                    state: agent.status,
                    detail: Some(format!("{} agent", agent.source)),
                    focus_target,
                }
            })
            .collect(),
    ))
}

pub(crate) fn snapshot() -> Result<Vec<AgentView>, String> {
    if let Some(agents) = from_v1_bridge() {
        return Ok(agents);
    }
    let path = crate::storage::agents_path()?;
    let Ok(bytes) = fs::read(path) else {
        return Ok(Vec::new());
    };
    let mut agents: Vec<AgentView> =
        serde_json::from_slice(&bytes).map_err(|error| error.to_string())?;
    for agent in &mut agents {
        agent.focus_target = None;
        agent.pet_id = pet_for(&agent.id);
    }
    Ok(validate(agents))
}

fn focus(route: &str) -> Result<(), String> {
    let mut child =
        Command::new(bridge_binary().ok_or_else(|| "v1 focus bridge is unavailable".to_string())?)
            .arg("--focus-route")
            .arg(route)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| format!("failed to start v1 focus bridge: {error}"))?;
    let status = wait_for_bridge(&mut child)?;
    if status.success() {
        Ok(())
    } else {
        Err("agent is no longer available".to_string())
    }
}

#[tauri::command]
pub(crate) async fn focus_agent(
    id: String,
    targets: tauri::State<'_, FocusTargets>,
) -> Result<(), String> {
    let start = Instant::now();
    let Some(route) = targets.get(&id) else {
        crate::focus_debug::record(format!("focus id={id} cache=miss"));
        return Err("agent is no longer available".to_string());
    };
    let result = tauri::async_runtime::spawn_blocking(move || focus(&route))
        .await
        .map_err(|_| "agent focus task failed".to_string())?;
    crate::focus_debug::record(format!(
        "focus id={id} elapsed_ms={} result={}",
        start.elapsed().as_millis(),
        result.as_ref().err().map_or("ok", String::as_str)
    ));
    result
}

#[tauri::command]
pub(crate) async fn list_agents(
    targets: tauri::State<'_, FocusTargets>,
) -> Result<Vec<AgentView>, String> {
    let start = Instant::now();
    let agents = tauri::async_runtime::spawn_blocking(snapshot)
        .await
        .map_err(|error| error.to_string())??;
    targets.replace(&agents);
    let ms = start.elapsed().as_millis();
    crate::focus_debug::record(format!("poll {ms}ms n={}", agents.len()));
    Ok(agents)
}
