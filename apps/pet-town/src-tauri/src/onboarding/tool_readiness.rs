use super::{process, tools};
use std::path::Path;
use std::time::Duration;

fn probe(path: &Path, args: &[&str]) -> Option<String> {
    crate::herdr_command::run_herdr_command_with_timeout(
        &path.as_os_str().to_owned(),
        None,
        &args.iter().map(|s| s.to_string()).collect::<Vec<_>>(),
        Duration::from_secs(8),
    )
}
pub(super) fn check(id: &str) -> (&'static str, &'static str) {
    let Ok((_, command)) = tools::spec(id) else {
        return ("unknown", "Choose a supported tool.");
    };
    let Some(path) = tools::executable(command) else {
        return ("missing", "Install this tool, then check again.");
    };
    let result = match id {
        "codex" => {
            if !probe(&path, &["login", "--help"]).is_some_and(|s| s.contains("status")) {
                return ("unknown", "This version has no supported sign-in check. Start your own agent in Herdr.");
            }
            probe(&path, &["login", "status"]).map(|_| true)
        }
        "claude" => {
            if !probe(&path, &["auth", "--help"]).is_some_and(|s| s.contains("status")) {
                return ("unknown", "This version has no supported sign-in check. Start your own agent in Herdr.");
            }
            probe(&path, &["auth", "status"]).map(|_| true)
        }
        "cursor" => {
            let Some(output) = probe(&path, &["status"]) else { return ("unknown", "Sign-in could not be checked. Use the official guide or start your own agent."); };
            let text = output.to_ascii_lowercase();
            if text.contains("not authenticated") || text.contains("not logged in") || text.contains("logged out") { Some(false) }
            else if text.contains("authenticated") || text.contains("logged in") { Some(true) }
            else { return ("unknown", "Cursor returned an unrecognized sign-in state. Start your own agent in Herdr."); }
        }
        _ => return ("unknown", "Automatic sign-in verification is unavailable for this tool. Start it yourself in Herdr to finish setup; the paid sample stays disabled."),
    };
    match result {
        Some(true) => ("ready", "Local sign-in is available. The sample still waits for startup approvals in Herdr."),
        _ => ("signIn", "Sign in through the tool’s official setup, then check again. No agent has been started."),
    }
}
pub(super) fn supports(id: &str) -> bool {
    process::text(&["agent", "start", "--help"], 5).is_ok_and(|help| {
        help.contains("--pane")
            && help.contains("--kind")
            && help
                .split(|c: char| !c.is_ascii_alphanumeric())
                .any(|value| value == id)
    })
}
