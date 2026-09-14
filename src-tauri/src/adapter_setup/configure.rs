use super::json_hooks::{JsonHookLayout, CLAUDE_EVENTS, CURSOR_EVENTS, FACTORY_EVENTS};
use super::{codex, files, json_hooks, plugins};

pub(super) fn run(id: &str, enabled: bool) -> Result<(), String> {
    if !matches!(
        id,
        "claude" | "codex" | "opencode" | "pi" | "factory" | "cursor"
    ) {
        return Err("unsupported adapter".to_string());
    }
    let config = files::settings_path(id)?;
    let operation = config
        .parent()
        .ok_or_else(|| "adapter path has no parent".to_string())?
        .join(format!(".agent-pets-{id}-operation"));
    files::with_file_lock(&operation, "adapter operation", || run_locked(id, enabled))
}

fn run_locked(id: &str, enabled: bool) -> Result<(), String> {
    let previous_epoch = crate::adapter_events::source_epoch(id);
    let was_disabled = crate::adapter_events::source_disabled(id);
    crate::adapter_events::set_source_enabled(id, enabled)?;
    let result = match id {
        "claude" => json_hooks::configure(
            id,
            &CLAUDE_EVENTS,
            JsonHookLayout::WrappedGroups {
                supports_async: true,
            },
            "Claude Code settings",
            enabled,
        ),
        "codex" => codex::configure(enabled),
        "opencode" | "pi" => plugins::configure(id, enabled),
        "factory" => json_hooks::configure(
            id,
            &FACTORY_EVENTS,
            JsonHookLayout::DirectGroups,
            "Factory Droid hooks",
            enabled,
        ),
        "cursor" => json_hooks::configure(
            id,
            &CURSOR_EVENTS,
            JsonHookLayout::CursorCommands,
            "Cursor hooks",
            enabled,
        ),
        _ => unreachable!(),
    };
    if let Err(error) = result {
        return match crate::adapter_events::restore_source_state(
            id,
            previous_epoch.as_deref(),
            was_disabled,
        ) {
            Ok(()) => Err(error),
            Err(rollback) => Err(format!("{error}; rollback failed: {rollback}")),
        };
    }
    crate::adapter_events::purge_source_records(id)?;
    Ok(())
}
