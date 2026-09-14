use crate::preferences::PreferencesStore;
use crate::preferences_model::PreferencesFile;
use std::fs;
use std::path::PathBuf;

fn fixture(name: &str) -> (PathBuf, Vec<String>) {
    let directory =
        std::env::temp_dir().join(format!("pet-village-store-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&directory);
    (
        directory.join("preferences.json"),
        vec!["cat".to_string(), "viking".to_string()],
    )
}

#[test]
fn first_apply_creates_complete_file() {
    let (path, ids) = fixture("first-apply");
    let store = PreferencesStore::load(path.clone(), ids.clone());
    assert!(!path.exists());
    let mut draft = PreferencesFile::defaults(&ids);
    draft.pets.get_mut("cat").unwrap().appearance.scale_percent = 135;
    store.apply(draft.clone(), 0).unwrap();
    assert_eq!(store.snapshot().preferences, draft);
    assert!(path.is_file());
    let _ = fs::remove_dir_all(path.parent().unwrap());
}

#[test]
fn invalid_reload_preserves_applied_snapshot() {
    let (path, ids) = fixture("invalid-reload");
    let store = PreferencesStore::load(path.clone(), ids.clone());
    let applied = PreferencesFile::defaults(&ids);
    store.apply(applied.clone(), 0).unwrap();
    fs::write(&path, "not json").unwrap();
    let revision = store.snapshot().revision;
    assert!(store.reload().is_err());
    assert_eq!(store.snapshot().revision, revision + 1);
    assert!(!store.snapshot().read_only);
    assert_eq!(store.snapshot().preferences, applied);
    assert!(!path.exists());
    assert!(fs::read_dir(path.parent().unwrap())
        .unwrap()
        .flatten()
        .any(|entry| entry
            .file_name()
            .to_string_lossy()
            .starts_with("preferences.invalid-")));
    let _ = fs::remove_dir_all(path.parent().unwrap());
}

#[test]
fn failed_invalid_preservation_blocks_apply() {
    let (path, ids) = fixture("invalid-preserve-failure");
    let store = PreferencesStore::load(path.clone(), ids);
    fs::create_dir_all(&path).unwrap();
    assert!(store.reload().is_err());
    let snapshot = store.snapshot();
    assert!(snapshot.read_only);
    assert!(store
        .apply(snapshot.preferences, snapshot.revision)
        .is_err());
    assert!(path.is_dir());
    let _ = fs::remove_dir_all(path.parent().unwrap());
}

#[test]
fn stale_apply_cannot_overwrite_reload() {
    let (path, ids) = fixture("stale-apply");
    let store = PreferencesStore::load(path.clone(), ids.clone());
    let stale = store.snapshot().preferences;
    let mut reloaded = stale.clone();
    reloaded.app.hide_completed_pets = true;
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(&path, serde_json::to_vec(&reloaded).unwrap()).unwrap();
    store.reload().unwrap();
    assert!(store.apply(stale, 0).is_err());
    assert_eq!(store.snapshot().preferences, reloaded);
    let _ = fs::remove_dir_all(path.parent().unwrap());
}

#[test]
fn rejects_incomplete_and_out_of_range_pet_entries() {
    let ids = vec!["cat".to_string(), "viking".to_string()];
    let mut missing = PreferencesFile::defaults(&ids);
    missing.pets.remove("viking");
    assert!(missing.validate(&ids).is_err());
    let mut oversized = PreferencesFile::defaults(&ids);
    oversized
        .pets
        .get_mut("cat")
        .unwrap()
        .appearance
        .scale_percent = 176;
    assert!(oversized.validate(&ids).is_err());

    let mut empty_cast = PreferencesFile::defaults(&ids);
    for pet in empty_cast.pets.values_mut() {
        pet.included_in_random_cast = false;
    }
    assert!(empty_cast.validate(&ids).is_err());

    let mut unsupported_delay = PreferencesFile::defaults(&ids);
    unsupported_delay.app.completed_hide_delay_minutes = 2;
    assert!(unsupported_delay.validate(&ids).is_err());
}

#[test]
fn first_apply_after_migration_preserves_schema_one_source() {
    let (path, ids) = fixture("migration-backup");
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    let source = r#"{"schemaVersion":1,"app":{"openWithHerdr":true,"settingsAppearance":"system","lastSelectedPetId":"cat"},"pets":{"cat":{"appearance":{"scalePercent":100,"opacityPercent":100},"labels":{"visibility":"always","textScalePercent":100},"motion":{"level":"standard","reduced":false,"pauseOnHover":false}},"viking":{"appearance":{"scalePercent":100,"opacityPercent":100},"labels":{"visibility":"always","textScalePercent":100},"motion":{"level":"standard","reduced":false,"pauseOnHover":false}}}}"#;
    fs::write(&path, source).unwrap();
    let backup = path.parent().unwrap().join("preferences.schema-1.json");
    fs::write(&backup, r#"{"schemaVersion":1,"app":{},"pets":{}}"#).unwrap();
    let store = PreferencesStore::load(path.clone(), ids);
    store.apply(store.snapshot().preferences, 0).unwrap();
    assert_eq!(fs::read_to_string(backup).unwrap(), source);
    assert!(fs::read_to_string(&path)
        .unwrap()
        .contains(r#""schemaVersion": 2"#));
    let _ = fs::remove_dir_all(path.parent().unwrap());
}

#[test]
fn invalid_reload_clears_pending_migration_backup() {
    let (path, ids) = fixture("migration-invalid-reload");
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    let source = r#"{"schemaVersion":1,"app":{"openWithHerdr":true,"settingsAppearance":"system","lastSelectedPetId":"cat"},"pets":{"cat":{"appearance":{"scalePercent":100,"opacityPercent":100},"labels":{"visibility":"always","textScalePercent":100},"motion":{"level":"standard","reduced":false,"pauseOnHover":false}},"viking":{"appearance":{"scalePercent":100,"opacityPercent":100},"labels":{"visibility":"always","textScalePercent":100},"motion":{"level":"standard","reduced":false,"pauseOnHover":false}}}}"#;
    fs::write(&path, source).unwrap();
    let store = PreferencesStore::load(path.clone(), ids);
    fs::write(&path, "invalid replacement").unwrap();
    assert!(store.reload().is_err());
    let snapshot = store.snapshot();
    store
        .apply(snapshot.preferences, snapshot.revision)
        .unwrap();
    let _ = fs::remove_dir_all(path.parent().unwrap());
}

#[test]
fn failed_migration_backup_does_not_replace_source() {
    let (path, ids) = fixture("migration-backup-failure");
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    let source = r#"{"schemaVersion":1,"app":{"openWithHerdr":true,"settingsAppearance":"system","lastSelectedPetId":"cat"},"pets":{"cat":{"appearance":{"scalePercent":100,"opacityPercent":100},"labels":{"visibility":"always","textScalePercent":100},"motion":{"level":"standard","reduced":false,"pauseOnHover":false}},"viking":{"appearance":{"scalePercent":100,"opacityPercent":100},"labels":{"visibility":"always","textScalePercent":100},"motion":{"level":"standard","reduced":false,"pauseOnHover":false}}}}"#;
    fs::write(&path, source).unwrap();
    fs::create_dir(path.parent().unwrap().join("preferences.schema-1.json")).unwrap();
    let store = PreferencesStore::load(path.clone(), ids);
    assert!(store.apply(store.snapshot().preferences, 0).is_err());
    assert_eq!(fs::read_to_string(&path).unwrap(), source);
    let _ = fs::remove_dir_all(path.parent().unwrap());
}

#[test]
fn future_schema_reload_advances_snapshot_revision() {
    let (path, ids) = fixture("future-reload");
    let store = PreferencesStore::load(path.clone(), ids);
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(&path, r#"{"schemaVersion":99}"#).unwrap();
    assert!(store.reload().is_err());
    assert_eq!(store.snapshot().revision, 1);
    assert!(store.snapshot().read_only);
    let _ = fs::remove_dir_all(path.parent().unwrap());
}

#[test]
fn future_schema_is_read_only_and_preserved() {
    let (path, ids) = fixture("future");
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(&path, r#"{"schemaVersion":99}"#).unwrap();
    let store = PreferencesStore::load(path.clone(), ids.clone());
    assert!(store.snapshot().read_only);
    assert!(store.apply(PreferencesFile::defaults(&ids), 0).is_err());
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        r#"{"schemaVersion":99}"#
    );
    let _ = fs::remove_dir_all(path.parent().unwrap());
}
