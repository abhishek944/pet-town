use serde::{Deserialize, Serialize};

#[derive(Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(super) struct Progress {
    pub step: u8,
    pub completed: bool,
    #[serde(default)]
    pub resume_step: Option<u8>,
    #[serde(default)]
    pub own_baseline: Option<Vec<String>>,
    pub tool: Option<String>,
    pub sample: Option<SampleOwner>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(super) struct SampleOwner {
    pub token: String,
    #[serde(default)]
    pub socket: Option<String>,
    pub workspace: Option<String>,
    pub tab: Option<String>,
    pub pane: Option<String>,
    pub session: Option<String>,
    pub tool: String,
    pub create_attempted: bool,
    pub launch_attempted: bool,
    pub prompt_attempted: bool,
    #[serde(default)]
    pub arrival_seen: bool,
    #[serde(default)]
    pub process: Option<ProcessIdentity>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Dependency {
    pub phase: String,
    pub message: String,
    pub version: Option<String>,
}
impl Dependency {
    pub fn new(phase: &str, message: &str) -> Self {
        Self {
            phase: phase.into(),
            message: message.into(),
            version: None,
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Tool {
    pub id: String,
    pub label: String,
    pub readiness: String,
    pub status: String,
    pub message: String,
}

#[derive(Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Sample {
    pub phase: String,
    pub status: Option<String>,
    pub agent_id: Option<String>,
    pub message: Option<String>,
    pub owned: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Context {
    pub step: u8,
    pub completed: bool,
    pub tool: Option<String>,
    pub strip_theme: String,
    pub preview_preferences: crate::preferences_model::PreferencesFile,
    pub installation_ready: bool,
    pub busy: bool,
    pub dependency: Dependency,
    pub tools: Vec<Tool>,
    pub sample: Sample,
    pub has_sample: bool,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(super) struct ProcessIdentity {
    pub pid: u32,
    pub started: String,
}
