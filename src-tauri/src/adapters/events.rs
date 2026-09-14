use super::{AdapterAgent, AdapterSnapshot, AgentAdapter};
use crate::adapter_events::read_records;
use crate::agents::AgentView;

pub(crate) struct EventAdapters;

impl AgentAdapter for EventAdapters {
    fn snapshot(&self) -> AdapterSnapshot {
        let agents = read_records()
            .into_iter()
            .map(|record| {
                let id = format!("{}:{}", record.source, record.session_key);
                AdapterAgent {
                    owner_key: id.clone(),
                    hosted_owner_key: record.hosted_owner_key,
                    view: AgentView {
                        id,
                        status: record.state,
                        label: record.label,
                        source: record.source,
                    },
                    focus_route: record
                        .focus_app
                        .map(|bundle_id| crate::focus::FocusRoute::Application { bundle_id }),
                }
            })
            .collect();
        AdapterSnapshot {
            available: true,
            agents,
        }
    }
}
