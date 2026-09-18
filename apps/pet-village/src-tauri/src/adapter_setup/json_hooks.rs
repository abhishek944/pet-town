use super::files::{
    hook_command, is_managed_hook_entry, read_json, read_json_with_original, settings_path,
    with_file_lock, write_json,
};
use serde_json::{json, Map, Value};

pub(super) const CLAUDE_EVENTS: [&str; 8] = [
    "SessionStart",
    "UserPromptSubmit",
    "PreToolUse",
    "PermissionRequest",
    "Notification",
    "Stop",
    "StopFailure",
    "SessionEnd",
];
pub(super) const FACTORY_EVENTS: [&str; 8] = [
    "SessionStart",
    "UserPromptSubmit",
    "PreToolUse",
    "PostToolUse",
    "Notification",
    "Stop",
    "SubagentStop",
    "SessionEnd",
];
pub(super) const CURSOR_EVENTS: [&str; 10] = [
    "sessionStart",
    "beforeSubmitPrompt",
    "preToolUse",
    "postToolUse",
    "postToolUseFailure",
    "beforeShellExecution",
    "afterFileEdit",
    "stop",
    "afterAgentResponse",
    "sessionEnd",
];

#[derive(Clone, Copy)]
pub(super) enum JsonHookLayout {
    WrappedGroups { supports_async: bool },
    DirectGroups,
    CursorCommands,
}

fn expected_entry(source: &str, event: &str, layout: JsonHookLayout) -> Result<Value, String> {
    let command = hook_command(source, event)?;
    Ok(match layout {
        JsonHookLayout::WrappedGroups { supports_async } => {
            let mut hook = Map::from_iter([
                ("type".to_string(), Value::String("command".to_string())),
                ("command".to_string(), Value::String(command)),
                ("timeout".to_string(), Value::Number(3.into())),
            ]);
            if supports_async && event != "SessionStart" && event != "SessionEnd" {
                hook.insert("async".to_string(), Value::Bool(true));
            }
            json!({ "hooks": [Value::Object(hook)] })
        }
        JsonHookLayout::DirectGroups => json!({
            "hooks": [{ "type": "command", "command": command, "timeout": 3 }]
        }),
        JsonHookLayout::CursorCommands => json!({
            "type": "command", "command": command, "timeout": 3, "failClosed": false
        }),
    })
}

fn hooks_object(
    settings: &Map<String, Value>,
    layout: JsonHookLayout,
) -> Option<&Map<String, Value>> {
    match layout {
        JsonHookLayout::DirectGroups => Some(settings),
        _ => settings.get("hooks").and_then(Value::as_object),
    }
}

pub(super) fn status(
    source: &str,
    events: &[&str],
    layout: JsonHookLayout,
    label: &str,
) -> &'static str {
    let Ok(path) = settings_path(source) else {
        return "error";
    };
    let Ok(settings) = read_json(&path, label) else {
        return "error";
    };
    let Some(hooks) = hooks_object(&settings, layout) else {
        return "notInstalled";
    };
    let found = hooks.values().any(is_managed_hook_entry);
    for event in events {
        let Some(entries) = hooks.get(*event).and_then(Value::as_array) else {
            return if found { "needsUpdate" } else { "notInstalled" };
        };
        let Ok(expected) = expected_entry(source, event, layout) else {
            return if found { "needsUpdate" } else { "notInstalled" };
        };
        if !entries.iter().any(|entry| entry == &expected) {
            return if found { "needsUpdate" } else { "notInstalled" };
        }
    }
    "installed"
}

fn retain_unmanaged(entry: &mut Value) -> bool {
    let Some(object) = entry.as_object_mut() else {
        return true;
    };
    let Some(hooks) = object.get_mut("hooks").and_then(Value::as_array_mut) else {
        return !is_managed_hook_entry(entry);
    };
    hooks.retain(|hook| !is_managed_hook_entry(hook));
    !hooks.is_empty()
}

fn remove_managed(settings: &mut Map<String, Value>, layout: JsonHookLayout) -> Result<(), String> {
    let direct = matches!(layout, JsonHookLayout::DirectGroups);
    let hooks = if direct {
        &mut *settings
    } else {
        let Some(value) = settings.get_mut("hooks") else {
            return Ok(());
        };
        value
            .as_object_mut()
            .ok_or_else(|| "adapter hooks must be an object".to_string())?
    };
    let names: Vec<String> = hooks.keys().cloned().collect();
    for name in names {
        let Some(entries) = hooks.get_mut(&name).and_then(Value::as_array_mut) else {
            continue;
        };
        entries.retain_mut(retain_unmanaged);
        if entries.is_empty() {
            hooks.remove(&name);
        }
    }
    if !direct && hooks.is_empty() {
        settings.remove("hooks");
    }
    Ok(())
}

pub(super) fn configure(
    source: &str,
    events: &[&str],
    layout: JsonHookLayout,
    label: &str,
    enabled: bool,
) -> Result<(), String> {
    let path = settings_path(source)?;
    with_file_lock(&path, label, || {
        let (mut settings, original) = read_json_with_original(&path, label)?;
        remove_managed(&mut settings, layout)?;
        if enabled {
            if matches!(layout, JsonHookLayout::CursorCommands) {
                settings
                    .entry("version".to_string())
                    .or_insert_with(|| Value::Number(1.into()));
            }
            let hooks = if matches!(layout, JsonHookLayout::DirectGroups) {
                &mut settings
            } else {
                settings
                    .entry("hooks".to_string())
                    .or_insert_with(|| Value::Object(Map::new()))
                    .as_object_mut()
                    .ok_or_else(|| format!("{label} hooks must be an object"))?
            };
            for event in events {
                let entries = hooks
                    .entry((*event).to_string())
                    .or_insert_with(|| Value::Array(Vec::new()))
                    .as_array_mut()
                    .ok_or_else(|| format!("{label} event {event} must be an array"))?;
                entries.push(expected_entry(source, event, layout)?);
            }
        }
        write_json(&path, &settings, original.as_deref(), label)
    })
}
