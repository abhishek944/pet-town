use pet_town_agent_broker::{AgentSnapshot, BrokerSnapshot};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(serde::Deserialize)]
struct MayorSessionOwner {
    pane: String,
    log: PathBuf,
}

pub(crate) fn collect_visible() -> BrokerSnapshot {
    let mut collected = pet_town_agent_broker::collect();
    let Some(owner) = crate::preferences_io::preferences_path()
        .ok()
        .and_then(|path| std::fs::read(path.with_file_name("firstmate-session.json")).ok())
        .and_then(|bytes| serde_json::from_slice::<MayorSessionOwner>(&bytes).ok())
    else {
        return collected;
    };
    if owner.pane.is_empty() || !owner.log.is_absolute() {
        return collected;
    }
    let owned_ids: Vec<String> = collected
        .focus_routes
        .iter()
        .filter_map(|(id, route)| match route {
            pet_town_agent_broker::FocusRoute::Herdr {
                pane_id,
                agent_session_id,
                ..
            } if pane_id == &owner.pane && PathBuf::from(agent_session_id) == owner.log => {
                Some(id.clone())
            }
            _ => None,
        })
        .collect();
    collected
        .snapshot
        .agents
        .retain(|agent| !owned_ids.contains(&agent.id));
    for id in owned_ids {
        collected.focus_routes.remove(&id);
    }
    collected
}

pub fn snapshot_json() -> String {
    let collected = collect_visible();
    serde_json::to_string(&collected.snapshot)
        .unwrap_or_else(|_| r#"{"available":false,"agents":[]}"#.to_string())
}

#[tauri::command]
pub(crate) async fn list_agents() -> Result<AgentSnapshot, String> {
    let collected = tauri::async_runtime::spawn_blocking(collect_visible)
        .await
        .unwrap_or_else(|_| BrokerSnapshot {
            snapshot: AgentSnapshot {
                available: false,
                agents: Vec::new(),
            },
            focus_routes: HashMap::new(),
        });
    Ok(collected.snapshot)
}
