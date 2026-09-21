use crate::agents::safe_display_label;
use crate::command;
use serde::Deserialize;
use std::collections::HashMap;
use std::ffi::OsString;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

const CACHE_TTL: Duration = Duration::from_secs(2);

#[derive(Debug, Deserialize)]
struct PaneListEnvelope {
    result: PaneListResult,
}
#[derive(Debug, Deserialize)]
struct PaneListResult {
    panes: Vec<RawPaneLabel>,
}
#[derive(Debug, Deserialize)]
struct RawPaneLabel {
    pane_id: String,
    label: Option<String>,
}
#[derive(Debug, Deserialize)]
struct TabListEnvelope {
    result: TabListResult,
}
#[derive(Debug, Deserialize)]
struct TabListResult {
    tabs: Vec<RawTabLabel>,
}
#[derive(Debug, Deserialize)]
struct RawTabLabel {
    tab_id: String,
    label: Option<String>,
    number: Option<u32>,
}
#[derive(Debug, Deserialize)]
struct WorkspaceListEnvelope {
    result: WorkspaceListResult,
}
#[derive(Debug, Deserialize)]
struct WorkspaceListResult {
    workspaces: Vec<RawWorkspaceLabel>,
}
#[derive(Debug, Deserialize)]
struct RawWorkspaceLabel {
    workspace_id: String,
    label: Option<String>,
}

#[derive(Clone, Default)]
pub(crate) struct SessionLabels {
    pub pane_labels: HashMap<String, String>,
    pub tab_fallback_labels: HashMap<String, String>,
}

#[derive(Default)]
struct CachedLabels {
    updated_at: Option<Instant>,
    labels: SessionLabels,
}

static CACHE: OnceLock<Mutex<HashMap<String, CachedLabels>>> = OnceLock::new();

fn space_tab_label(space_name: &str, tab: &RawTabLabel) -> String {
    let tab_name = safe_display_label(tab.label.as_deref())
        .or_else(|| tab.number.map(|number| number.to_string()))
        .unwrap_or_else(|| "?".to_string());
    format!("{space_name}-{tab_name}")
}

fn query(herdr: &OsString, socket: Option<&str>, workspaces: &[String]) -> SessionLabels {
    let mut labels = SessionLabels::default();
    let arguments = vec!["workspace".to_string(), "list".to_string()];
    let spaces: HashMap<String, String> = command::run(herdr, socket, &arguments)
        .and_then(|text| serde_json::from_str::<WorkspaceListEnvelope>(&text).ok())
        .map(|envelope| {
            envelope
                .result
                .workspaces
                .into_iter()
                .filter_map(|space| {
                    safe_display_label(space.label.as_deref())
                        .map(|name| (space.workspace_id, name))
                })
                .collect()
        })
        .unwrap_or_default();

    for workspace in workspaces {
        let pane_arguments = vec![
            "pane".to_string(),
            "list".to_string(),
            "--workspace".to_string(),
            workspace.clone(),
        ];
        if let Some(envelope) = command::run(herdr, socket, &pane_arguments)
            .and_then(|text| serde_json::from_str::<PaneListEnvelope>(&text).ok())
        {
            for pane in envelope.result.panes {
                if let Some(label) = safe_display_label(pane.label.as_deref()) {
                    labels.pane_labels.insert(pane.pane_id, label);
                }
            }
        }
        let tab_arguments = vec![
            "tab".to_string(),
            "list".to_string(),
            "--workspace".to_string(),
            workspace.clone(),
        ];
        if let Some(envelope) = command::run(herdr, socket, &tab_arguments)
            .and_then(|text| serde_json::from_str::<TabListEnvelope>(&text).ok())
        {
            for tab in envelope.result.tabs {
                if let Some(space_name) = spaces.get(workspace) {
                    labels
                        .tab_fallback_labels
                        .insert(tab.tab_id.clone(), space_tab_label(space_name, &tab));
                }
            }
        }
    }
    labels
}

pub(crate) fn for_session(
    herdr: &OsString,
    socket: Option<&str>,
    workspaces: &[String],
) -> SessionLabels {
    let key = format!(
        "{}\0{}",
        socket.unwrap_or("<current-session>"),
        workspaces.join("\0")
    );
    let cache = CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    if let Ok(stored) = cache.lock() {
        if let Some(entry) = stored.get(&key) {
            if entry
                .updated_at
                .is_some_and(|updated| updated.elapsed() < CACHE_TTL)
            {
                return entry.labels.clone();
            }
        }
    }
    let labels = query(herdr, socket, workspaces);
    if let Ok(mut stored) = cache.lock() {
        stored.insert(
            key,
            CachedLabels {
                updated_at: Some(Instant::now()),
                labels: labels.clone(),
            },
        );
    }
    labels
}
