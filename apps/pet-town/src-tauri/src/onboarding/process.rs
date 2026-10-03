use serde_json::Value;
use std::time::Duration;

pub(super) fn text(args: &[&str], seconds: u64) -> Result<String, String> {
    text_at(
        std::env::var("HERDR_SOCKET_PATH").ok().as_deref(),
        args,
        seconds,
    )
}
fn text_at(socket: Option<&str>, args: &[&str], seconds: u64) -> Result<String, String> {
    crate::herdr_command::run_herdr_command_with_timeout(
        &crate::orchestrator::herdr_binary(),
        socket,
        &args.iter().map(|s| s.to_string()).collect::<Vec<_>>(),
        Duration::from_secs(seconds),
    )
    .ok_or_else(|| {
        "Herdr could not finish this action. Open Herdr to check its status, then retry.".into()
    })
}
pub(super) fn command(args: &[&str], seconds: u64) -> Result<Value, String> {
    parse(&text(args, seconds)?)
}
pub(super) fn owned(
    owner: &super::model::SampleOwner,
    args: &[&str],
    seconds: u64,
) -> Result<Value, String> {
    let socket = owner
        .socket
        .as_deref()
        .ok_or("The sample’s Herdr session cannot be confirmed. No action was sent.")?;
    parse(&text_at(Some(socket), args, seconds)?)
}
fn parse(text: &str) -> Result<Value, String> {
    let value: Value =
        serde_json::from_str(text).map_err(|_| "Herdr returned unsupported data.")?;
    if value.get("ok") == Some(&Value::Bool(false)) || value.get("error").is_some() {
        return Err(
            "Herdr could not complete this action. Check its window before retrying.".into(),
        );
    }
    Ok(value)
}
pub(super) fn string(value: &Value, path: &[&str]) -> Result<String, String> {
    path.iter()
        .try_fold(value, |v, key| v.get(*key))
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .ok_or_else(|| {
            "Herdr omitted a required setup identifier. No further action was sent.".into()
        })
}

pub(super) fn socket() -> Result<String, String> {
    if let Ok(socket) = std::env::var("HERDR_SOCKET_PATH") {
        if !socket.is_empty() {
            return Ok(socket);
        }
    }
    let list: Value = serde_json::from_str(&text(&["session", "list", "--json"], 5)?)
        .map_err(|_| "Herdr session data is unavailable.")?;
    let records = list["sessions"]
        .as_array()
        .ok_or("Herdr did not return its sessions.")?;
    let default = records
        .iter()
        .find(|s| s["name"] == "default")
        .ok_or("Open Herdr’s default session, then check again.")?;
    string(default, &["socket_path"])
}
