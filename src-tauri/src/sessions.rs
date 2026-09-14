use crate::agents::{unavailable_snapshot, AgentSnapshot};
use crate::broker;
use crate::focus::FocusTargets;
use std::collections::HashMap;

pub fn snapshot_json() -> String {
    serde_json::to_string(&broker::collect().snapshot)
        .unwrap_or_else(|_| r#"{"available":false,"agents":[]}"#.to_string())
}

#[tauri::command]
pub(crate) async fn list_agents(
    targets: tauri::State<'_, FocusTargets>,
) -> Result<AgentSnapshot, String> {
    let collected = tauri::async_runtime::spawn_blocking(broker::collect)
        .await
        .unwrap_or_else(|_| broker::BrokerSnapshot {
            snapshot: unavailable_snapshot(),
            focus_routes: HashMap::new(),
        });
    targets.replace(collected.focus_routes);
    Ok(collected.snapshot)
}
