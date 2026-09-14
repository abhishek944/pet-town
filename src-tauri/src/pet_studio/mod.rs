mod apng;
pub(crate) mod candidate_commands;
pub(crate) mod catalog;
pub(crate) mod draft_commands;
mod extension_activation;
mod extension_catalog;
mod extension_store;
mod extension_types;
pub(crate) mod generation_commands;
mod images;
mod manifest;
mod openai;
pub(crate) mod pack_commands;
mod store;
mod types;

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
        if let Some(path) = &self.1 {
            let _ = std::fs::remove_dir_all(path);
        }
    }
}

impl Drop for PetStudioState {
    fn drop(&mut self) {
        if let Some(path) = &self.1 {
            let _ = std::fs::remove_dir_all(path);
        }
    }
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
