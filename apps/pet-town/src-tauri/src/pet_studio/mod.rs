mod animation_generation;
mod apng;
pub(crate) mod candidate_commands;
pub(crate) mod catalog;
pub(crate) mod draft_commands;
mod extension_activation;
mod extension_catalog;
mod extension_store;
mod extension_types;
mod generated_frame_validation;
mod generation_artifacts;
pub(crate) mod generation_commands;
mod generation_process;
mod generation_protocol;
mod generation_worker;
mod images;
mod manifest;
pub(crate) mod pack_commands;
mod store;
mod types;
mod worker_process;
mod worker_registry;

use std::collections::HashMap;
use std::sync::Mutex;
use types::Draft;

pub struct PetStudioState(Mutex<HashMap<String, Draft>>, Option<std::path::PathBuf>);

impl PetStudioState {
    pub fn load() -> Self {
        let directory = store::root()
            .ok()
            .map(|root| root.join(".drafts").join(uuid::Uuid::new_v4().to_string()));
        if let Some(path) = &directory {
            let _ = store::create_private_dir(path);
        }
        Self(Mutex::new(HashMap::new()), directory)
    }
    pub fn cleanup(&self) {
        worker_registry::stop_all();
        if let Some(path) = &self.1 {
            let _ = std::fs::remove_dir_all(path);
        }
    }
}

impl Drop for PetStudioState {
    fn drop(&mut self) {
        worker_registry::stop_all();
        if let Some(path) = &self.1 {
            let _ = std::fs::remove_dir_all(path);
        }
    }
}

pub fn clear_orchestrator_pet_cache() {}

pub fn orchestrator_pet_ready(pet_id: Option<&str>) -> bool {
    pet_id == Some(crate::preferences_model::ASSISTANT_PET_ID)
        && crate::preferences_model::bundled_pet_ids()
            .iter()
            .any(|id| id == crate::preferences_model::ASSISTANT_PET_ID)
}

fn with_draft<T>(
    state: &PetStudioState,
    id: &str,
    action: impl FnOnce(&mut Draft) -> Result<T, String>,
) -> Result<T, String> {
    let mut drafts = state.0.lock().unwrap_or_else(|error| error.into_inner());
    let draft = drafts
        .get_mut(id)
        .ok_or_else(|| "This Pet Studio draft is no longer available.".to_string())?;
    action(draft)
}
