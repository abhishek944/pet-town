use super::files::{
    hook_command, read_regular_file, settings_path, with_file_lock, write_atomic, FILE_MARKER,
};

const EVENTS: [&str; 8] = [
    "SessionStart",
    "UserPromptSubmit",
    "PreToolUse",
    "PermissionRequest",
    "PostToolUse",
    "Interrupt",
    "Stop",
    "SessionEnd",
];

fn managed_block() -> Result<String, String> {
    let mut block = String::from("# agent-pets-managed start\n");
    for event in EVENTS {
        block.push_str(&format!("[[hooks.{event}]]\n"));
        block.push_str(&format!("[[hooks.{event}.hooks]]\n"));
        block.push_str("type = \"command\"\ncommand = ");
        block.push_str(
            &serde_json::to_string(&hook_command("codex", event)?)
                .map_err(|_| "could not encode Codex hook command".to_string())?,
        );
        block.push_str("\ntimeout = 3\n");
        if event != "SessionStart" && event != "SessionEnd" {
            block.push_str("async = true\n");
        }
        block.push('\n');
    }
    block.push_str("# agent-pets-managed end\n");
    Ok(block)
}

fn strip_managed_blocks(mut text: String) -> Result<String, String> {
    const START: &str = "# agent-pets-managed start";
    const END: &str = "# agent-pets-managed end";
    loop {
        let Some(start) = text.find(START) else {
            if text.contains(END) {
                return Err("Codex managed hook markers are incomplete".to_string());
            }
            return Ok(text);
        };
        let Some(relative_end) = text[start..].find(END) else {
            return Err("Codex managed hook markers are incomplete".to_string());
        };
        let end = start + relative_end + END.len();
        let trailing_newline = usize::from(text[end..].starts_with('\n'));
        text.replace_range(start..end + trailing_newline, "");
    }
}

fn policy_blocks(path: &std::path::Path) -> bool {
    let Ok(Some(bytes)) = read_regular_file(path, "Codex managed policy") else {
        return false;
    };
    String::from_utf8(bytes)
        .ok()
        .and_then(|text| text.parse::<toml::Table>().ok())
        .is_some_and(|table| {
            table
                .get("allow_managed_hooks_only")
                .and_then(toml::Value::as_bool)
                == Some(true)
                || table
                    .get("features")
                    .and_then(toml::Value::as_table)
                    .and_then(|features| features.get("hooks"))
                    .and_then(toml::Value::as_bool)
                    == Some(false)
        })
}

fn administrator_hooks_blocked() -> bool {
    let mut paths = vec![
        std::path::PathBuf::from("/etc/codex/requirements.toml"),
        std::path::PathBuf::from("/etc/codex/managed_config.toml"),
    ];
    if let Some(path) = std::env::var_os("PET_VILLAGE_CODEX_POLICY_PATH") {
        paths.push(path.into());
    }
    paths.iter().any(|path| policy_blocks(path))
}

pub(super) fn status() -> &'static str {
    if administrator_hooks_blocked() {
        return "disabled";
    }
    let Ok(path) = settings_path("codex") else {
        return "error";
    };
    let bytes = match read_regular_file(&path, "Codex settings") {
        Ok(Some(bytes)) => bytes,
        Ok(None) => return "notInstalled",
        Err(_) => return "error",
    };
    let Ok(text) = String::from_utf8(bytes) else {
        return "error";
    };
    let parsed = if text.trim().is_empty() {
        toml::Table::new()
    } else {
        let Ok(parsed) = text.parse::<toml::Table>() else {
            return "error";
        };
        parsed
    };
    if parsed
        .get("features")
        .and_then(toml::Value::as_table)
        .is_some_and(|features| {
            features.get("hooks").and_then(toml::Value::as_bool) == Some(false)
                || features.get("codex_hooks").and_then(toml::Value::as_bool) == Some(false)
        })
    {
        return "disabled";
    }
    if !text.contains(FILE_MARKER) {
        return "notInstalled";
    }
    let Ok(expected) = managed_block() else {
        return "needsUpdate";
    };
    if text.contains(&expected) {
        "verificationRequired"
    } else if text.contains(FILE_MARKER) {
        "needsUpdate"
    } else {
        "notInstalled"
    }
}

pub(super) fn configure(enabled: bool) -> Result<(), String> {
    let path = settings_path("codex")?;
    with_file_lock(&path, "Codex settings", || {
        let original = read_regular_file(&path, "Codex settings")?;
        let text = String::from_utf8(original.clone().unwrap_or_default())
            .map_err(|_| "Codex settings are not valid UTF-8".to_string())?;
        if !text.trim().is_empty() && text.parse::<toml::Table>().is_err() {
            return Err("Codex settings are not valid TOML".to_string());
        }
        let mut next = strip_managed_blocks(text)?;
        if enabled {
            if !next.is_empty() && !next.ends_with('\n') {
                next.push('\n');
            }
            if !next.is_empty() {
                next.push('\n');
            }
            next.push_str(&managed_block()?);
        }
        if !next.trim().is_empty() && next.parse::<toml::Table>().is_err() {
            return Err("generated Codex settings are not valid TOML".to_string());
        }
        write_atomic(
            &path,
            next.as_bytes(),
            original.as_deref(),
            "Codex settings",
        )
    })
}
