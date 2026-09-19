use crate::agents::AgentView;
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Default)]
pub(crate) struct FocusTargets(Mutex<HashMap<String, String>>);

impl FocusTargets {
    pub(crate) fn replace(&self, agents: &[AgentView]) {
        if let Ok(mut stored) = self.0.lock() {
            *stored = agents
                .iter()
                .filter_map(|agent| Some((agent.id.clone(), agent.focus_target.clone()?)))
                .collect();
        }
    }

    pub(crate) fn get(&self, id: &str) -> Option<String> {
        self.0.lock().ok()?.get(id).cloned()
    }
}
