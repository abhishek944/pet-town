pub use super::extension_types::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

pub const MAX_IMAGE_BYTES: usize = 20 * 1024 * 1024;

#[derive(Clone)]
pub struct AnimationDraft {
    pub apng: PathBuf,
    pub duration_ms: u32,
    pub role: String,
}

pub struct Draft {
    pub id: String,
    pub directory: PathBuf,
    pub animations: HashMap<String, AnimationDraft>,
    pub extension_candidates: Vec<StagedPetExtension>,
}

pub struct StagedPetExtension {
    pub base_id: String,
    pub candidate_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreateDraftRequest {
    pub display_name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AnimationUpload {
    pub draft_id: String,
    pub animation_id: String,
    pub apng_data_url: String,
    pub role: String,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct MenuActionInput {
    pub id: String,
    pub label: String,
    pub animation_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SavePackRequest {
    pub draft_id: String,
    pub display_name: String,
    pub walk: String,
    pub work: String,
    pub blocked: String,
    pub celebrate: String,
    pub sleep: String,
    pub unknown: String,
    pub assign_to_orchestrator: bool,
    pub orchestrator_walk: String,
    pub orchestrator_listening: String,
    pub actions: Vec<MenuActionInput>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DraftView {
    pub draft_id: String,
    pub display_name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnimationAssetView {
    pub animation_id: String,
    pub data_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPackView {
    pub id: String,
    pub display_name: String,
    pub manifest: serde_json::Value,
    pub assets: HashMap<String, String>,
}
