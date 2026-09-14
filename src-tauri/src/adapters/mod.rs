use crate::agents::AgentView;
use crate::focus::FocusRoute;

pub(crate) mod events;
pub(crate) mod herdr;

#[derive(Debug)]
pub(crate) struct AdapterAgent {
    /// Stable, opaque ownership key used by the broker to collapse duplicate reports.
    pub(crate) owner_key: String,
    /// Optional host claim. The broker uses it only when that host session exists now.
    pub(crate) hosted_owner_key: Option<String>,
    pub(crate) view: AgentView,
    pub(crate) focus_route: Option<FocusRoute>,
}

#[derive(Debug)]
pub(crate) struct AdapterSnapshot {
    pub(crate) available: bool,
    pub(crate) agents: Vec<AdapterAgent>,
}

pub(crate) trait AgentAdapter: Send + Sync {
    fn snapshot(&self) -> AdapterSnapshot;
}
