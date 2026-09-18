use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use tauri::{Emitter, Manager};

pub(crate) fn root() -> Result<PathBuf, String> {
    let home = std::env::var_os("HOME").ok_or("HOME is not available")?;
    Ok(PathBuf::from(home).join(".pet-village-v2"))
}

fn preferences_path() -> Result<PathBuf, String> {
    Ok(root()?.join("preferences.json"))
}

pub(crate) fn defaults() -> Value {
    json!({
        "schemaVersion": 1,
        "appearance": "system",
        "reducedMotion": false,
        "autonomyEnabled": true,
        "activityLevel": "balanced",
        "playroomEnabled": true,
        "naturalLanguageEnabled": true,
        "resolver": "local",
        "petScale": 100,
        "showLabels": true
    })
}

fn validate(value: &Value) -> Result<(), String> {
    let object = value.as_object().ok_or("preferences must be an object")?;
    if object.get("schemaVersion").and_then(Value::as_u64) != Some(1) {
        return Err("unsupported v2 preference schema".to_string());
    }
    let appearance = object.get("appearance").and_then(Value::as_str);
    if !matches!(appearance, Some("system" | "light" | "dark")) {
        return Err("appearance must be system, light, or dark".to_string());
    }
    let scale = object.get("petScale").and_then(Value::as_u64).unwrap_or(0);
    if !(75..=175).contains(&scale) {
        return Err("petScale must be 75–175".to_string());
    }
    if !matches!(
        object.get("activityLevel").and_then(Value::as_str),
        Some("calm" | "balanced" | "playful")
    ) {
        return Err("activityLevel is unsupported".to_string());
    }
    if object.get("resolver").and_then(Value::as_str) != Some("local") {
        return Err("resolver must be local".to_string());
    }
    for key in [
        "reducedMotion",
        "autonomyEnabled",
        "playroomEnabled",
        "naturalLanguageEnabled",
        "showLabels",
    ] {
        if object.get(key).and_then(Value::as_bool).is_none() {
            return Err(format!("{key} must be a boolean"));
        }
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn get_preferences() -> Result<Value, String> {
    let path = preferences_path()?;
    let Ok(bytes) = fs::read(path) else {
        return Ok(defaults());
    };
    let value: Value = serde_json::from_slice(&bytes).map_err(|error| error.to_string())?;
    validate(&value)?;
    Ok(value)
}

#[tauri::command]
pub(crate) fn apply_preferences(
    app: tauri::AppHandle,
    preferences: Value,
) -> Result<Value, String> {
    validate(&preferences)?;
    let path = preferences_path()?;
    let parent = path.parent().ok_or("invalid preferences path")?;
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    let temporary = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec_pretty(&preferences).map_err(|error| error.to_string())?;
    fs::write(&temporary, bytes).map_err(|error| error.to_string())?;
    fs::rename(temporary, path).map_err(|error| error.to_string())?;
    if preferences.get("playroomEnabled").and_then(Value::as_bool) == Some(false) {
        if let Some(playroom) = app.get_webview_window("playroom") {
            let _ = playroom.close();
        }
    }
    app.emit("preferences-changed", &preferences)
        .map_err(|error| error.to_string())?;
    Ok(preferences)
}

#[tauri::command]
pub(crate) fn reset_v2_data(app: tauri::AppHandle) -> Result<Value, String> {
    let directory = root()?;
    if directory.exists() {
        fs::remove_dir_all(directory).map_err(|error| error.to_string())?;
    }
    let preferences = defaults();
    app.emit("preferences-changed", &preferences)
        .map_err(|error| error.to_string())?;
    app.emit("capability-mappings-changed", ())
        .map_err(|error| error.to_string())?;
    Ok(preferences)
}

pub(crate) fn playroom_enabled() -> bool {
    get_preferences()
        .ok()
        .and_then(|value| value.get("playroomEnabled").and_then(Value::as_bool))
        .unwrap_or(true)
}

pub(crate) fn agents_path() -> Result<PathBuf, String> {
    Ok(root()?.join("agents.json"))
}
