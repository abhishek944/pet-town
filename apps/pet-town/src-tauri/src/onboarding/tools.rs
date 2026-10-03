use super::model::Tool;
use std::{ffi::OsString, path::PathBuf};

pub(super) const TOOLS: [(&str, &str, &str); 6] = [
    ("codex", "Codex", "codex"),
    ("claude", "Claude Code", "claude"),
    ("pi", "Pi", "pi"),
    ("opencode", "OpenCode", "opencode"),
    ("cursor", "Cursor Agent", "agent"),
    ("droid", "Factory Droid", "droid"),
];

pub(super) fn executable(name: &str) -> Option<PathBuf> {
    let mut directories: Vec<PathBuf> = std::env::var_os("PATH")
        .map(|p| std::env::split_paths(&p).collect())
        .unwrap_or_default();
    directories.extend(["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"].map(PathBuf::from));
    if let Some(home) = std::env::var_os("HOME") {
        for suffix in [".local/bin", ".cargo/bin", ".bun/bin", ".npm-global/bin"] {
            directories.push(PathBuf::from(&home).join(suffix));
        }
    }
    directories.into_iter().map(|d| d.join(name)).find(|p| {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            p.metadata()
                .is_ok_and(|m| m.is_file() && m.permissions().mode() & 0o111 != 0)
        }
        #[cfg(not(unix))]
        {
            p.is_file()
        }
    })
}

pub(super) fn spec(id: &str) -> Result<(&'static str, &'static str), String> {
    TOOLS
        .iter()
        .find(|(key, _, _)| *key == id)
        .map(|(_, label, executable)| (*label, *executable))
        .ok_or_else(|| "Choose a supported coding tool.".into())
}

pub(super) fn list(selected: Option<&str>) -> Vec<Tool> {
    let help = super::process::text(&["agent", "start", "--help"], 5).unwrap_or_default();
    TOOLS
        .iter()
        .map(|(id, label, command)| {
            let found = executable(command).is_some();
            let supported = help.contains("--pane")
                && help.contains("--kind")
                && help
                    .split(|c: char| !c.is_ascii_alphanumeric())
                    .any(|value| value == *id);
            let (readiness, message) = if !supported {
                (
                    "unsupported",
                    "Update Herdr through its original installer to use this tool.",
                )
            } else if selected == Some(id) {
                super::tool_readiness::check(id)
            } else {
                (
                    "unknown",
                    "Choose this tool to check sign-in before starting an agent.",
                )
            };
            Tool {
                id: (*id).into(),
                label: (*label).into(),
                readiness: readiness.into(),
                status: if !supported {
                    "unsupported"
                } else if found {
                    "found"
                } else {
                    "missing"
                }
                .into(),
                message: message.into(),
            }
        })
        .collect()
}

pub(super) fn launch_path(id: &str) -> Result<OsString, String> {
    let (_, command) = spec(id)?;
    let path = executable(command)
        .or_else(|| {
            (id == "cursor")
                .then(|| executable("cursor-agent"))
                .flatten()
        })
        .ok_or("Install the selected coding tool, then check again.")?;
    let parent = path
        .parent()
        .ok_or("The tool executable folder is unavailable.")?;
    // A GUI launch need not inherit the user’s terminal PATH. Keep standard locations too.
    let mut paths = vec![
        parent.to_path_buf(),
        PathBuf::from("/opt/homebrew/bin"),
        PathBuf::from("/usr/local/bin"),
        PathBuf::from("/usr/bin"),
        PathBuf::from("/bin"),
    ];
    if let Some(current) = std::env::var_os("PATH") {
        paths.extend(std::env::split_paths(&current));
    }
    if id == "cursor" && command == "agent" && executable("agent").is_none() {
        return Err("This Cursor installation uses a different launcher. Start it yourself in Herdr for now.".into());
    }
    std::env::join_paths(paths).map_err(|_| "The selected tool PATH could not be prepared.".into())
}
