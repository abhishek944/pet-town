use crate::adapters::events::EventAdapters;
use crate::adapters::herdr::HerdrAdapter;
use crate::adapters::{AdapterAgent, AgentAdapter};
use crate::agents::{AgentSnapshot, AgentView};
use crate::focus::FocusRoute;
use std::collections::{BTreeMap, HashMap};

pub(crate) struct BrokerSnapshot {
    pub(crate) snapshot: AgentSnapshot,
    pub(crate) focus_routes: HashMap<String, FocusRoute>,
}

fn adapters() -> Vec<Box<dyn AgentAdapter>> {
    vec![Box::new(HerdrAdapter), Box::new(EventAdapters)]
}

fn source_priority(source: &str) -> u8 {
    // A validated host owns a session over lifecycle hints from the hosted harness.
    // Herdr is the first host adapter; later adapters must not override this route.
    match source {
        "herdr" => 0,
        _ => 1,
    }
}

pub(crate) fn collect() -> BrokerSnapshot {
    let mut any_available = false;
    let mut by_owner = BTreeMap::<String, AdapterAgent>::new();

    for adapter in adapters() {
        let result = adapter.snapshot();
        any_available |= result.available;
        for agent in result.agents {
            let effective_owner = agent
                .hosted_owner_key
                .as_ref()
                .filter(|owner| by_owner.contains_key(*owner))
                .cloned()
                .unwrap_or_else(|| agent.owner_key.clone());
            let replace = by_owner.get(&effective_owner).is_some_and(|current| {
                source_priority(&agent.view.source) < source_priority(&current.view.source)
            });
            if replace || !by_owner.contains_key(&effective_owner) {
                by_owner.insert(effective_owner, agent);
            }
        }
    }

    let mut views = Vec::<AgentView>::with_capacity(by_owner.len());
    let mut focus_routes = HashMap::new();
    for agent in by_owner.into_values() {
        if let Some(route) = agent.focus_route {
            focus_routes.insert(agent.view.id.clone(), route);
        }
        views.push(agent.view);
    }
    views.sort_by(|left, right| left.id.cmp(&right.id));

    BrokerSnapshot {
        snapshot: AgentSnapshot {
            available: any_available,
            agents: views,
        },
        focus_routes,
    }
}
