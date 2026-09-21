mod agents;
mod command;
mod events;
mod focus;
mod herdr;
mod labels;
#[cfg(target_os = "macos")]
mod macos_activation;
mod state;

use agents::parse_agent_list;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};

pub use agents::AgentView;
pub use focus::focus_route;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum FocusRoute {
    Herdr {
        pane_id: String,
        socket: Option<String>,
        agent_session_id: String,
    },
    Application {
        bundle_id: String,
    },
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentSnapshot {
    pub available: bool,
    pub agents: Vec<AgentView>,
}

#[derive(Debug)]
pub struct BrokerSnapshot {
    pub snapshot: AgentSnapshot,
    pub focus_routes: HashMap<String, FocusRoute>,
}

#[derive(Debug)]
struct AdapterAgent {
    owner_key: String,
    hosted_owner_key: Option<String>,
    view: AgentView,
    focus_route: Option<FocusRoute>,
}

fn source_priority(source: &str) -> u8 {
    match source {
        "herdr" => 0,
        _ => 1,
    }
}

pub fn collect() -> BrokerSnapshot {
    let snapshots = [herdr::snapshot(parse_agent_list), events::snapshot()];
    let mut available = false;
    let mut by_owner = BTreeMap::<String, AdapterAgent>::new();

    for snapshot in snapshots {
        available |= snapshot.available;
        for agent in snapshot.agents {
            let owner = agent
                .hosted_owner_key
                .as_ref()
                .filter(|candidate| by_owner.contains_key(*candidate))
                .cloned()
                .unwrap_or_else(|| agent.owner_key.clone());
            let replace = by_owner.get(&owner).is_some_and(|current| {
                source_priority(&agent.view.source) < source_priority(&current.view.source)
            });
            if replace || !by_owner.contains_key(&owner) {
                by_owner.insert(owner, agent);
            }
        }
    }

    let mut agents = Vec::with_capacity(by_owner.len());
    let mut focus_routes = HashMap::new();
    for agent in by_owner.into_values() {
        if let Some(route) = agent.focus_route {
            focus_routes.insert(agent.view.id.clone(), route);
        }
        agents.push(agent.view);
    }
    agents.sort_by(|left, right| left.id.cmp(&right.id));
    BrokerSnapshot {
        snapshot: AgentSnapshot { available, agents },
        focus_routes,
    }
}

struct AdapterSnapshot {
    available: bool,
    agents: Vec<AdapterAgent>,
}
