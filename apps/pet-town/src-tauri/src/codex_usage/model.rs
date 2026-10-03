use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::PathBuf;

#[derive(Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct Tokens {
    pub input_tokens: u64,
    pub cached_input_tokens: u64,
    pub output_tokens: u64,
    pub reasoning_output_tokens: u64,
    pub total_tokens: u64,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct Session {
    pub version: u8,
    pub session_id: String,
    pub path: PathBuf,
    #[serde(default)]
    pub transcript_root: Option<PathBuf>,
    pub agents: Vec<String>,
    pub model: Option<String>,
    #[serde(default)]
    pub hook_model: Option<String>,
    #[serde(default)]
    pub offset: u64,
    #[serde(default)]
    pub scan_offset: u64,
    #[serde(default)]
    pub file_identity: Option<String>,
    #[serde(default)]
    pub tokens: Option<Tokens>,
    #[serde(default)]
    pub models: BTreeMap<String, Tokens>,
    #[serde(default)]
    pub updated_at_seconds: u64,
    #[serde(default)]
    pub estimate_incomplete: bool,
    #[serde(default)]
    pub partial: bool,
    #[serde(default)]
    pub measurement_incomplete: bool,
    #[serde(default)]
    pub inherited_history: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Reading {
    pub status: String,
    pub model: Option<String>,
    #[serde(flatten)]
    pub(super) tokens: Tokens,
    pub estimated_credits: Option<f64>,
    pub models: Vec<String>,
    pub updated_at_seconds: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

impl Default for Reading {
    fn default() -> Self {
        Self {
            status: "unavailable".into(),
            model: None,
            tokens: Tokens::default(),
            estimated_credits: None,
            models: Vec::new(),
            updated_at_seconds: None,
            reason: None,
        }
    }
}

#[derive(Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Snapshot {
    pub available: bool,
    pub by_agent: BTreeMap<String, Reading>,
    pub totals: Reading,
    pub tracked_sessions: usize,
    pub measured_sessions: usize,
}

impl Tokens {
    pub(super) fn add(&mut self, other: &Self) {
        self.input_tokens = self.input_tokens.saturating_add(other.input_tokens);
        self.cached_input_tokens = self
            .cached_input_tokens
            .saturating_add(other.cached_input_tokens);
        self.output_tokens = self.output_tokens.saturating_add(other.output_tokens);
        self.reasoning_output_tokens = self
            .reasoning_output_tokens
            .saturating_add(other.reasoning_output_tokens);
        self.total_tokens = self.total_tokens.saturating_add(other.total_tokens);
    }
}
