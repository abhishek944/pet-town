pub use super::extension_types::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

pub const MODELS: [&str; 2] = ["gpt-image-2.5-sunburst", "gpt-image-2.5-flare"];
pub const MAX_IMAGE_BYTES: usize = 20 * 1024 * 1024;

#[derive(Clone)]
pub struct AnimationDraft {
    pub frames: Option<Vec<PathBuf>>,
    pub candidate_frames: Option<Vec<PathBuf>>,
    pub candidate_signature: Option<String>,
    pub candidate_generation_id: Option<String>,
    pub candidate_apng: Option<PathBuf>,
    pub candidate_duration_ms: Option<u32>,
    pub candidate_role: Option<String>,
    pub apng: Option<PathBuf>,
    pub duration_ms: u32,
    pub role: String,
}

pub struct Draft {
    pub id: String,
    pub directory: PathBuf,
    pub reference: Option<PathBuf>,
    pub animations: HashMap<String, AnimationDraft>,
    pub extension_candidates: Vec<StagedPetExtension>,
}

pub struct StagedPetExtension {
    pub base_id: String,
    pub candidate_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiStatus {
    pub available: bool,
    pub source: Option<&'static str>,
    pub models: [&'static str; 2],
    pub message: &'static str,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreateDraftRequest {
    pub display_name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ReferenceRequest {
    pub draft_id: String,
    pub prompt: String,
    pub model: String,
    pub quality: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ReferenceUpload {
    pub draft_id: String,
    pub png_data_url: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AnimationUpload {
    pub draft_id: String,
    pub animation_id: String,
    pub apng_data_url: String,
    pub role: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AnimationRequest {
    pub draft_id: String,
    pub animation_id: String,
    pub prompt: String,
    pub role: String,
    pub model: String,
    pub quality: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AssembleRequest {
    pub draft_id: String,
    pub animation_id: String,
    pub duration_ms: u32,
    pub role: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ApproveAnimationRequest {
    pub draft_id: String,
    pub animation_id: String,
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
pub struct AssetView {
    pub data_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnimationAssetView {
    pub animation_id: String,
    pub data_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnimationFramesView {
    pub animation_id: String,
    pub role: String,
    pub data_urls: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnimationRestoreView {
    pub apng_data_url: String,
    pub frame_data_urls: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPackView {
    pub id: String,
    pub display_name: String,
    pub manifest: serde_json::Value,
    pub assets: HashMap<String, String>,
}
