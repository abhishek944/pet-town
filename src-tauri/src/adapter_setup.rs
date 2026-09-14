mod codex;
mod configure;
mod files;
mod json_hooks;
mod plugins;

use json_hooks::{JsonHookLayout, CLAUDE_EVENTS, CURSOR_EVENTS, FACTORY_EVENTS};
use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AdapterSetupView {
    id: &'static str,
    name: &'static str,
    mechanism: &'static str,
    status: &'static str,
    status_label: &'static str,
    action: Option<&'static str>,
    capabilities: Vec<&'static str>,
}

fn adapter_status(id: &str) -> &'static str {
    match id {
        "herdr" => "builtIn",
        "claude" => json_hooks::status(
            "claude",
            &CLAUDE_EVENTS,
            JsonHookLayout::WrappedGroups {
                supports_async: true,
            },
            "Claude Code settings",
        ),
        "codex" => codex::status(),
        "opencode" => plugins::status("opencode"),
        "pi" => plugins::status("pi"),
        "factory" => json_hooks::status(
            "factory",
            &FACTORY_EVENTS,
            JsonHookLayout::DirectGroups,
            "Factory Droid hooks",
        ),
        "cursor" => json_hooks::status(
            "cursor",
            &CURSOR_EVENTS,
            JsonHookLayout::CursorCommands,
            "Cursor hooks",
        ),
        _ => "error",
    }
}

fn setup_view(
    id: &'static str,
    name: &'static str,
    mechanism: &'static str,
    capabilities: Vec<&'static str>,
) -> AdapterSetupView {
    let status = adapter_status(id);
    AdapterSetupView {
        id,
        name,
        mechanism,
        status,
        status_label: match status {
            "builtIn" => "Built in",
            "installed" => "Connected",
            "verificationRequired" => "Verify in Codex",
            "disabled" => "Hooks disabled",
            "needsUpdate" => "Update needed",
            "error" => "Configuration error",
            "conflict" => "File in use",
            _ => "Setup",
        },
        action: match status {
            "builtIn" | "conflict" | "error" | "disabled" => None,
            "installed" | "verificationRequired" => Some("remove"),
            "needsUpdate" => Some("update"),
            _ => Some("connect"),
        },
        capabilities,
    }
}

pub fn setups_json() -> Result<String, String> {
    serde_json::to_string(&list_adapter_setups())
        .map_err(|_| "could not encode adapter statuses".to_string())
}

#[tauri::command]
pub(crate) fn list_adapter_setups() -> Vec<AdapterSetupView> {
    vec![
        setup_view(
            "herdr",
            "Herdr",
            "Authoritative session host",
            vec!["Live sessions", "Exact focus"],
        ),
        setup_view(
            "claude",
            "Claude Code",
            "Lifecycle hooks",
            vec!["Activity", "Permissions", "Supported app focus"],
        ),
        setup_view(
            "codex",
            "Codex",
            "Lifecycle hooks",
            vec!["Activity", "Permissions", "Supported app focus"],
        ),
        setup_view(
            "opencode",
            "OpenCode",
            "Plugin events",
            vec!["Activity", "Permissions", "Supported app focus"],
        ),
        setup_view(
            "pi",
            "Pi",
            "Extension events",
            vec!["Activity", "User input", "Supported app focus"],
        ),
        setup_view(
            "factory",
            "Factory Droid",
            "Lifecycle hooks",
            vec!["Activity", "Supported app focus"],
        ),
        setup_view(
            "cursor",
            "Cursor",
            "Editor hooks",
            vec!["Activity", "Supported app focus"],
        ),
    ]
}

pub fn configure_adapter(id: &str, enabled: bool) -> Result<(), String> {
    configure::run(id, enabled)
}

#[tauri::command]
pub(crate) fn set_adapter_enabled(
    id: String,
    enabled: bool,
) -> Result<Vec<AdapterSetupView>, String> {
    configure_adapter(&id, enabled)?;
    Ok(list_adapter_setups())
}
