use super::{model::Dependency, process};
use std::path::Path;

pub(super) fn check() -> Dependency {
    let binary = crate::orchestrator::herdr_binary();
    let version = match process::text(&["--version"], 5) {
        Ok(value) if value.trim().starts_with("herdr ") => value.trim().chars().take(40).collect::<String>(),
        _ if Path::new(&binary).exists() => return Dependency::new("notReady", "Herdr is installed but could not start. Check the existing installation before retrying."),
        _ => return Dependency::new("missing", "Install Herdr once to give your agents a place to work."),
    };
    let help = process::text(&["agent", "start", "--help"], 5);
    let capable = help.is_ok_and(|help| {
        help.contains("--pane") && help.contains("codex") && help.contains("--kind")
    });
    let ready = capable
        && process::command(&["workspace", "list"], 5)
            .is_ok_and(|v| v["result"]["workspaces"].is_array());
    Dependency {
        phase: if ready { "ready" } else { "notReady" }.into(),
        message: if ready { "Herdr is ready. We’ll use your existing installation." }
        else if capable { "Herdr is installed. Open it once, then check again." }
        else { "This Herdr installation needs a newer agent-launch interface. Update through its original installer or package manager." }.into(),
        version: Some(version),
    }
}
