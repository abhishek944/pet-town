use super::types::MenuActionInput;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SaveExtensionRequest {
    pub draft_id: String,
    pub base_id: String,
    pub state_assignments: HashMap<String, String>,
    pub actions: Vec<MenuActionInput>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StoredPetExtension {
    pub format_version: u32,
    pub base_id: String,
    pub extension_version: String,
    pub parent_extension_version: Option<String>,
    pub draft_id: Option<String>,
    pub clips: serde_json::Map<String, serde_json::Value>,
    pub states: serde_json::Map<String, serde_json::Value>,
    pub actions: serde_json::Map<String, serde_json::Value>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PetExtensionView {
    pub base_id: String,
    pub extension_version: String,
    pub clips: serde_json::Map<String, serde_json::Value>,
    pub states: serde_json::Map<String, serde_json::Value>,
    pub actions: serde_json::Map<String, serde_json::Value>,
    pub assets: HashMap<String, String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PetExtensionCandidateView {
    pub candidate_id: String,
    pub extension: PetExtensionView,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PetExtensionCatalogView {
    pub extensions: Vec<PetExtensionView>,
    pub warnings: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivateExtensionResult {
    pub id: String,
    pub reload_warning: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscardDraftResult {
    pub cleanup_warning: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ActivateExtensionRequest {
    pub draft_id: String,
    pub base_id: String,
    pub candidate_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DiscardExtensionCandidateRequest {
    pub base_id: String,
    pub candidate_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DiscardDraftRequest {
    pub draft_id: String,
}
