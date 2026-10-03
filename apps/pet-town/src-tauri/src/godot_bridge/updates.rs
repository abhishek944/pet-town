use serde_json::Value;
use tauri::{AppHandle, Manager};

pub(super) fn snapshot(app: &AppHandle, snapshot: &mut Value) {
    let state = app.state::<crate::app_updates::AppUpdates>();
    snapshot["nativeMessages"] = Value::Array(
        app.state::<super::GodotState>()
            .update_error
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .take()
            .into_iter()
            .map(Value::String)
            .collect(),
    );
    snapshot["appUpdate"] = serde_json::to_value(state.native_snapshot()).unwrap_or(Value::Null);
    snapshot["updatePrepare"] = state
        .native_preparation()
        .map(Value::String)
        .unwrap_or(Value::Null);
}

pub(super) fn action(app: &AppHandle, request: &Value) -> Result<(), String> {
    if !super::focused(app) {
        return Err("Focus the town before using app updates.".into());
    }
    let action = request["action"].as_str().unwrap_or("");
    if !matches!(
        action,
        "update_check" | "update_download" | "update_install"
    ) {
        return Err("Unknown update action.".into());
    }
    let app = app.clone();
    let action = action.to_owned();
    tauri::async_runtime::spawn(async move {
        let result = match action.as_str() {
            "update_check" => crate::app_updates::download::check(app.clone())
                .await
                .map(|_| ()),
            "update_download" => crate::app_updates::download::download(app.clone())
                .await
                .map(|_| ()),
            _ => crate::app_updates::install::install(app.clone()).await,
        };
        if let Err(error) = result {
            *app.state::<super::GodotState>()
                .update_error
                .lock()
                .unwrap_or_else(|e| e.into_inner()) = Some(error);
        }
    });
    Ok(())
}

pub(super) fn respond(app: &AppHandle, request: &Value) -> Result<(), String> {
    crate::town_voice::release_talk(app);
    super::terminal::release(app);
    crate::app_updates::prepare::respond_native(
        app,
        request["id"]
            .as_str()
            .ok_or("Update preparation ID is missing.")?
            .into(),
        request["ready"].as_bool().unwrap_or(false),
        request["error"].as_str().map(str::to_owned),
    )
}
