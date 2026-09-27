use crate::preferences_io::{self, ReadResult};
use crate::preferences_model::PreferencesFile;
use crate::preferences_state;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
pub(crate) struct StoreState {
    pub revision: u64,
    pub ids: Vec<String>,
    pub applied: PreferencesFile,
    pub warning: Option<String>,
    pub read_only: bool,
}
pub struct PreferencesStore {
    pub(crate) path: Option<PathBuf>,
    pub(crate) state: Mutex<StoreState>,
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreferencesSnapshot {
    pub revision: u64,
    pub preferences: PreferencesFile,
    pub defaults: PreferencesFile,
    pub pet_ids: Vec<String>,
    pub warning: Option<String>,
    pub read_only: bool,
}
impl PreferencesStore {
    pub fn load_default() -> Self {
        let ids = preferences_state::installed_pet_ids();
        match preferences_io::preferences_path() {
            Ok(path) => Self::load(path, ids),
            Err(error) => Self::without_path(ids, error),
        }
    }
    fn without_path(ids: Vec<String>, warning: String) -> Self {
        let applied = PreferencesFile::defaults(&ids);
        Self {
            path: None,
            state: Mutex::new(StoreState {
                revision: 0,
                ids,
                applied,
                warning: Some(warning),
                read_only: true,
            }),
        }
    }
    pub(crate) fn load(path: PathBuf, ids: Vec<String>) -> Self {
        let defaults = PreferencesFile::defaults(&ids);
        let state = match preferences_io::read(&path, &ids) {
            ReadResult::Missing => preferences_state::valid(defaults),
            ReadResult::Valid(applied) => preferences_state::valid(applied),
            ReadResult::Future(version) => StoreState {
                revision: 0,
                ids: Vec::new(),
                applied: defaults,
                warning: Some(format!(
                    "preferences are read-only because they use newer schema version {version}; update Pet Town"
                )),
                read_only: true,
            },
            ReadResult::Invalid(error) => preferences_state::invalid(&path, defaults, error),
        };
        Self {
            path: Some(path),
            state: Mutex::new(StoreState { ids, ..state }),
        }
    }

    pub fn snapshot(&self) -> PreferencesSnapshot {
        let state = self.state.lock().unwrap_or_else(|error| error.into_inner());
        self.snapshot_locked(&state)
    }
    pub(crate) fn snapshot_locked(&self, state: &StoreState) -> PreferencesSnapshot {
        PreferencesSnapshot {
            revision: state.revision,
            preferences: state.applied.clone(),
            defaults: PreferencesFile::defaults(&state.ids),
            pet_ids: state.ids.clone(),
            warning: state.warning.clone(),
            read_only: state.read_only,
        }
    }
    pub fn apply(
        &self,
        draft: PreferencesFile,
        expected_revision: u64,
    ) -> Result<PreferencesSnapshot, String> {
        let path = self
            .path
            .as_deref()
            .ok_or_else(|| "preferences path is unavailable".to_string())?;
        let mut state = self.state.lock().unwrap_or_else(|error| error.into_inner());
        draft.validate(&state.ids)?;
        if expected_revision != state.revision {
            return Err("preferences changed since this draft was loaded; review the latest settings and try again".into());
        }
        if state.read_only {
            return Err(state
                .warning
                .clone()
                .unwrap_or_else(|| "preferences are read-only".to_string()));
        }
        let outcome = crate::preferences_registration::save_draft(path, &mut state, &draft)?;
        state.applied = draft;
        state.warning = match outcome {
            preferences_io::SaveOutcome::Durable => None,
            preferences_io::SaveOutcome::CommittedWithWarning(warning) => Some(warning),
        };
        state.revision = state.revision.wrapping_add(1);
        Ok(self.snapshot_locked(&state))
    }

    pub fn reload(&self) -> Result<PreferencesSnapshot, String> {
        let path = self
            .path
            .as_deref()
            .ok_or_else(|| "preferences path is unavailable".to_string())?;
        let mut state = self.state.lock().unwrap_or_else(|error| error.into_inner());
        match preferences_io::read(path, &state.ids) {
            ReadResult::Missing => {
                state.applied = PreferencesFile::defaults(&state.ids);
                state.warning = None;
                state.read_only = false;
            }
            ReadResult::Valid(applied) => {
                state.applied = applied;
                state.warning = None;
                state.read_only = false;
            }
            ReadResult::Future(version) => {
                state.warning = Some(format!(
                    "preferences are read-only because they use newer schema version {version}; update Pet Town"
                ));
                state.read_only = true;
                state.revision = state.revision.wrapping_add(1);
                return Err(state.warning.clone().unwrap());
            }
            ReadResult::Invalid(error) => {
                let (warning, protect_source) = preferences_io::invalid_warning(path, error);
                state.warning = Some(warning);
                state.read_only = protect_source;
                state.revision = state.revision.wrapping_add(1);
                return Err(state.warning.clone().unwrap());
            }
        }
        state.revision = state.revision.wrapping_add(1);
        Ok(self.snapshot_locked(&state))
    }

    pub fn contains_id(&self, id: &str) -> bool {
        self.state
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .ids
            .iter()
            .any(|item| item == id)
    }
}
