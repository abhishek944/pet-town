use serde::Serialize;
use std::collections::HashMap;
use std::time::Duration;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceTarget {
    pub id: String,
    pub label: String,
    pub project: String,
    #[serde(skip)]
    pub cwd: std::path::PathBuf,
}

pub(crate) use super::herdr_process::binary;
pub use super::herdr_process::{command, text};

fn listed() -> Result<Vec<WorkspaceTarget>, String> {
    let value = command(&["workspace".into(), "list".into()], Duration::from_secs(5))?;
    let panes = command(&["pane".into(), "list".into()], Duration::from_secs(5))?;
    let pane_cwds: HashMap<&str, &str> = panes["result"]["panes"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|pane| Some((pane["workspace_id"].as_str()?, pane["cwd"].as_str()?)))
        .collect();
    let entries = value["result"]["workspaces"]
        .as_array()
        .ok_or_else(|| "Herdr returned no workspace list.".to_string())?;
    Ok(entries
        .iter()
        .filter_map(|entry| {
            let id = entry["workspace_id"].as_str()?.to_string();
            let label = entry["label"]
                .as_str()
                .or_else(|| entry["name"].as_str())
                .unwrap_or("Workspace");
            let cwd = entry["cwd"]
                .as_str()
                .or_else(|| entry["worktree"]["checkout_path"].as_str())
                .or_else(|| pane_cwds.get(id.as_str()).copied())?;
            let cwd = std::path::PathBuf::from(cwd);
            if !cwd.is_absolute() || !cwd.is_dir() {
                return None;
            }
            let project = cwd
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("project");
            Some(WorkspaceTarget {
                id,
                label: clean(label),
                project: clean(project),
                cwd,
            })
        })
        .collect())
}

pub fn workspaces() -> Result<Vec<WorkspaceTarget>, String> {
    Ok(listed()?
        .into_iter()
        .filter(|item| item.label != "pet-town-orchestrator")
        .collect())
}

pub fn dedicated(target: &WorkspaceTarget) -> Result<String, String> {
    if let Some(existing) = listed()?
        .into_iter()
        .find(|item| item.label == "pet-town-orchestrator" && item.cwd == target.cwd)
    {
        return Ok(existing.id);
    }
    let value = command(
        &[
            "workspace".into(),
            "create".into(),
            "--cwd".into(),
            target.cwd.to_string_lossy().into_owned(),
            "--label".into(),
            "pet-town-orchestrator".into(),
            "--no-focus".into(),
        ],
        Duration::from_secs(10),
    )?;
    value["result"]["workspace"]["workspace_id"]
        .as_str()
        .map(str::to_string)
        .ok_or_else(|| "Herdr did not return the dedicated workspace.".into())
}

/// Resolves an arbitrary session folder to a Herdr workspace id, reusing
/// the open space at that folder or creating one named after it.
pub fn workspace_for_folder(path: &str) -> Result<String, String> {
    let cwd = std::path::PathBuf::from(path);
    if !cwd.is_absolute() || !cwd.is_dir() {
        return Err("Choose an existing folder for Pi sessions.".into());
    }
    if let Some(id) = listed()?
        .into_iter()
        .find(|item| item.cwd == cwd)
        .map(|item| item.id)
    {
        return Ok(id);
    }
    let name = cwd
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("project");
    let value = command(
        &[
            "workspace".into(),
            "create".into(),
            "--cwd".into(),
            cwd.to_string_lossy().into_owned(),
            "--label".into(),
            clean(name),
            "--no-focus".into(),
        ],
        Duration::from_secs(10),
    )?;
    value["result"]["workspace"]["workspace_id"]
        .as_str()
        .map(str::to_string)
        .ok_or_else(|| "Herdr did not return the created workspace.".into())
}

fn clean(value: &str) -> String {
    value
        .chars()
        .filter(|character| !character.is_control())
        .take(48)
        .collect()
}
