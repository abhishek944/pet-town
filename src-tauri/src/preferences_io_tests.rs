use crate::preferences_io::{self, ReadResult, SaveOutcome};
use crate::preferences_model::{PreferencesFile, SCHEMA_VERSION};
use std::fs;
use std::path::PathBuf;

fn temporary_path(name: &str) -> PathBuf {
    std::env::temp_dir().join(format!("pet-village-{name}-{}", std::process::id()))
}

#[test]
fn reports_post_commit_sync_failure_as_committed() {
    let ids = vec!["cat".to_string()];
    let path = temporary_path("preferences-sync-warning").join("preferences.json");
    let preferences = PreferencesFile::defaults(&ids);
    let outcome =
        preferences_io::save_with_sync(
            &path,
            &preferences,
            |_| Err("injected sync failure".into()),
        )
        .unwrap();
    assert!(matches!(outcome, SaveOutcome::CommittedWithWarning(_)));
    assert!(
        matches!(preferences_io::read(&path, &ids), ReadResult::Valid(value) if value == preferences)
    );
    let _ = fs::remove_dir_all(path.parent().unwrap());
}

#[test]
fn invalid_backups_do_not_replace_each_other() {
    let directory = temporary_path("invalid-backup-collision");
    let path = directory.join("preferences.json");
    fs::create_dir_all(&directory).unwrap();
    fs::write(&path, "first invalid file").unwrap();
    let first = preferences_io::preserve_invalid(&path).unwrap().unwrap();
    fs::write(&path, "second invalid file").unwrap();
    let second = preferences_io::preserve_invalid(&path).unwrap().unwrap();
    assert_ne!(first, second);
    assert_eq!(fs::read_to_string(first).unwrap(), "first invalid file");
    assert_eq!(fs::read_to_string(second).unwrap(), "second invalid file");
    let _ = fs::remove_dir_all(directory);
}

#[test]
fn round_trips_complete_preferences() {
    let ids = vec!["cat".to_string(), "viking".to_string()];
    let path = temporary_path("preferences-roundtrip").join("preferences.json");
    let preferences = PreferencesFile::defaults(&ids);
    preferences_io::save(&path, &preferences).unwrap();
    assert!(
        matches!(preferences_io::read(&path, &ids), ReadResult::Valid(value) if value == preferences)
    );
    let _ = fs::remove_dir_all(path.parent().unwrap());
}

#[test]
fn migrates_schema_one_across_cast_changes() {
    let ids = vec!["cat".to_string(), "dragon".to_string()];
    let path = temporary_path("preferences-v1");
    fs::write(&path, r#"{"schemaVersion":1,"app":{"openWithHerdr":true,"settingsAppearance":"system","lastSelectedPetId":"viking"},"pets":{"cat":{"appearance":{"scalePercent":100,"opacityPercent":100},"labels":{"visibility":"always","textScalePercent":100},"motion":{"level":"standard","reduced":false,"pauseOnHover":false}},"viking":{"appearance":{"scalePercent":100,"opacityPercent":100},"labels":{"visibility":"always","textScalePercent":100},"motion":{"level":"standard","reduced":false,"pauseOnHover":false}}}}"#).unwrap();
    let ReadResult::Migrated(value) = preferences_io::read(&path, &ids) else {
        panic!("schema version 1 preferences did not migrate");
    };
    assert_eq!(value.schema_version, SCHEMA_VERSION);
    assert!(!value.app.hide_completed_pets);
    assert_eq!(value.app.completed_hide_delay_minutes, 5);
    assert_eq!(value.app.last_selected_pet_id, "cat");
    assert!(value.pets.values().all(|pet| pet.included_in_random_cast));
    assert_eq!(value.pets.keys().cloned().collect::<Vec<_>>(), ids);
    assert!(fs::read_to_string(&path)
        .unwrap()
        .contains(r#""schemaVersion":1"#));
    let _ = fs::remove_file(path);
}

#[test]
fn recognizes_future_schema_without_overwriting() {
    let path = temporary_path("preferences-future");
    fs::write(&path, r#"{"schemaVersion":99}"#).unwrap();
    assert!(matches!(
        preferences_io::read(&path, &[]),
        ReadResult::Future(99)
    ));
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        r#"{"schemaVersion":99}"#
    );
    let _ = fs::remove_file(path);
}
