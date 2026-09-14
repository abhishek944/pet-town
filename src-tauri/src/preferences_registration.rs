use crate::preferences::{PreferencesSnapshot, PreferencesStore, StoreState};
use crate::preferences_io::{self, ReadResult, SaveOutcome};

impl PreferencesStore {
    pub fn refresh_installed(&self) -> PreferencesSnapshot {
        let ids = crate::preferences_state::installed_pet_ids();
        let mut state = self.state.lock().unwrap_or_else(|error| error.into_inner());
        if state.ids == ids {
            return self.snapshot_locked(&state);
        }
        state.ids = ids;
        reconcile(&mut state);
        state.revision = state.revision.wrapping_add(1);
        self.snapshot_locked(&state)
    }

    pub fn register_pet(&self, id: String, assign_orchestrator: bool) -> PreferencesSnapshot {
        let mut state = self.state.lock().unwrap_or_else(|error| error.into_inner());
        state.ids = crate::preferences_state::installed_pet_ids();
        if !state.ids.contains(&id) {
            state.ids.push(id.clone());
            state.ids.sort();
        }
        reconcile(&mut state);
        if assign_orchestrator {
            state.applied.app.orchestrator.pet_id = Some(id.clone());
            state.applied.app.orchestrator.enabled = true;
        }
        state.revision = state.revision.wrapping_add(1);
        if !state.read_only {
            if let Some(path) = &self.path {
                let path = path.clone();
                if let Err(error) = crate::preferences_lock::exclusive(&path, || {
                    merge_and_save(&path, &mut state, &id, assign_orchestrator)
                }) {
                    state.warning = Some(error);
                }
            }
        }
        self.snapshot_locked(&state)
    }
}

fn reconcile(state: &mut StoreState) {
    let ids = state.ids.clone();
    state.applied.pets.retain(|id, _| ids.contains(id));
    for id in &ids {
        state.applied.pets.entry(id.clone()).or_default();
    }
    if state
        .applied
        .app
        .orchestrator
        .pet_id
        .as_ref()
        .is_some_and(|id| !ids.contains(id))
    {
        state.applied.app.orchestrator.pet_id = None;
    }
    if !state
        .applied
        .pets
        .contains_key(&state.applied.app.last_selected_pet_id)
    {
        state.applied.app.last_selected_pet_id =
            crate::preferences_model::PreferencesFile::defaults(&state.ids)
                .app
                .last_selected_pet_id;
    }
    if !state
        .applied
        .pets
        .values()
        .any(|pet| pet.included_in_random_cast)
    {
        if let Some(pet) = state.applied.pets.values_mut().next() {
            pet.included_in_random_cast = true;
        }
    }
}

pub fn save_draft(
    path: &std::path::Path,
    state: &mut StoreState,
    draft: &crate::preferences_model::PreferencesFile,
) -> Result<SaveOutcome, String> {
    crate::preferences_lock::exclusive(path, || {
        let installed = crate::preferences_state::installed_pet_ids();
        if installed != state.ids {
            return Err(
                "installed pets changed in another app instance; reload and try again".into(),
            );
        }
        match preferences_io::read(path, &installed) {
            ReadResult::Valid(value) if value != state.applied => {
                return Err(
                    "preferences changed in another app instance; reload and try again".into(),
                );
            }
            ReadResult::Future(_) | ReadResult::Invalid(_) => {
                return Err("preferences changed on disk and cannot be overwritten safely".into())
            }
            _ => {}
        }
        preferences_io::save(path, draft)
    })
}

fn merge_and_save(
    path: &std::path::Path,
    state: &mut StoreState,
    id: &str,
    assign_orchestrator: bool,
) -> Result<(), String> {
    match preferences_io::read(path, &state.ids) {
        ReadResult::Valid(value) => state.applied = value,
        ReadResult::Missing => {}
        ReadResult::Future(_) | ReadResult::Invalid(_) => {
            return Err(
                "The pet is active, but existing preferences could not be updated safely.".into(),
            )
        }
    }
    state.applied.pets.entry(id.to_string()).or_default();
    if assign_orchestrator {
        state.applied.app.orchestrator.pet_id = Some(id.to_string());
        state.applied.app.orchestrator.enabled = true;
    }
    state.warning = match preferences_io::save(path, &state.applied)? {
        SaveOutcome::Durable => None,
        SaveOutcome::CommittedWithWarning(warning) => Some(warning),
    };
    Ok(())
}
