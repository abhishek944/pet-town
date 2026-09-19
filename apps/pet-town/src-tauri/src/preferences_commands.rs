use crate::preferences::{PreferencesSnapshot, PreferencesStore};
use crate::preferences_io::{self, ReadResult};
use crate::preferences_model::PreferencesFile;
use crate::preferences_state::installed_pet_ids;
use tauri::{AppHandle, Emitter, Manager};

pub fn startup_enabled_from_disk() -> bool {
    let ids = installed_pet_ids();
    let Ok(path) = preferences_io::preferences_path() else {
        return true;
    };
    match preferences_io::read(&path, &ids) {
        ReadResult::Valid(value) => value.app.open_with_herdr,
        ReadResult::Future(_) | ReadResult::Missing | ReadResult::Invalid(_) => true,
    }
}

#[tauri::command]
pub fn get_preferences(state: tauri::State<'_, PreferencesStore>) -> PreferencesSnapshot {
    state.refresh_installed()
}

#[tauri::command]
pub fn apply_preferences(
    mut draft: PreferencesFile,
    expected_revision: u64,
    app: AppHandle,
    state: tauri::State<'_, PreferencesStore>,
) -> Result<PreferencesSnapshot, String> {
    draft.normalize_assistant();
    let snapshot = state.apply(draft, expected_revision)?;
    let _ = app.emit_to("main", "preferences-applied", &snapshot);
    crate::orchestrator::commands::preferences_changed(&app);
    Ok(snapshot)
}

pub fn reload_and_emit(app: &AppHandle) -> Result<PreferencesSnapshot, String> {
    match app.state::<PreferencesStore>().reload() {
        Ok(snapshot) => {
            let _ = app.emit("preferences-reloaded", &snapshot);
            let _ = app.emit_to("main", "preferences-applied", &snapshot);
            crate::orchestrator::commands::preferences_changed(app);
            Ok(snapshot)
        }
        Err(error) => {
            let snapshot = app.state::<PreferencesStore>().snapshot();
            let _ = app.emit("preferences-reloaded", &snapshot);
            Err(error)
        }
    }
}

#[tauri::command]
pub fn reload_preferences(app: AppHandle) -> Result<PreferencesSnapshot, String> {
    reload_and_emit(&app)
}
