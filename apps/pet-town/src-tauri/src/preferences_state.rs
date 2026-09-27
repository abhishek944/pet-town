use crate::preferences::StoreState;
use crate::preferences_io;
use crate::preferences_model::{bundled_pet_ids, PreferencesFile};
use std::path::Path;

pub fn installed_pet_ids() -> Vec<String> {
    let mut ids = bundled_pet_ids();
    if let Ok(packs) = crate::pet_studio::catalog::list() {
        ids.extend(packs.into_iter().map(|pack| pack.id));
        ids.sort();
        ids.dedup();
    }
    ids
}

pub fn valid(applied: PreferencesFile) -> StoreState {
    StoreState {
        revision: 0,
        ids: Vec::new(),
        applied,
        warning: None,
        read_only: false,
    }
}

pub fn invalid(path: &Path, defaults: PreferencesFile, error: String) -> StoreState {
    let (warning, read_only) = preferences_io::invalid_warning(path, error);
    StoreState {
        revision: 0,
        ids: Vec::new(),
        applied: defaults,
        warning: Some(warning),
        read_only,
    }
}
