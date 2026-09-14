use super::payload_string;
use serde_json::Value;

fn normalized_name(event: &str, payload: &Value) -> String {
    let mut value = event.trim().to_ascii_lowercase();
    if value == "notification" {
        if let Some(kind) = payload_string(payload, &["notification_type", "type", "matcher"]) {
            value.push(':');
            value.push_str(&kind.to_ascii_lowercase());
        }
    }
    value
}

pub(super) fn state(source: &str, event: &str, payload: &Value) -> Option<&'static str> {
    let event = normalized_name(event, payload);
    match source {
        "claude" => match event.as_str() {
            "sessionend" => None,
            "sessionstart" => Some("idle"),
            "permissionrequest"
            | "notification:permission_prompt"
            | "notification:idle_prompt"
            | "notification:elicitation_dialog"
            | "notification:elicitation_url_dialog"
            | "notification:agent_needs_input" => Some("blocked"),
            "stop" | "stopfailure" | "notification:agent_completed" => Some("done"),
            _ => Some("working"),
        },
        "codex" => match event.as_str() {
            "sessionend" => None,
            "sessionstart" => Some("idle"),
            "permissionrequest" => Some("blocked"),
            "interrupt" | "stop" => Some("done"),
            _ => Some("working"),
        },
        "factory" => match event.as_str() {
            "sessionend" => None,
            "sessionstart" => Some("idle"),
            "notification:agent_needs_input"
            | "notification:idle_prompt"
            | "notification:permission_prompt"
            | "notification:elicitation_dialog" => Some("blocked"),
            "stop" => Some("done"),
            _ => Some("working"), // SubagentStop does not end the parent session.
        },
        "cursor" => match event.as_str() {
            "sessionend" => None,
            "sessionstart" => Some("idle"),
            "stop" | "afteragentresponse" => Some("done"),
            _ => Some("working"), // Tool failures do not end the parent session.
        },
        "opencode" => match event.as_str() {
            "session_end" => None,
            "session_start" => Some("idle"),
            "permission_request" => Some("blocked"),
            "stop" => Some("done"),
            _ => Some("working"),
        },
        "pi" => match event.as_str() {
            "session_end" => None,
            "session_start" => Some("idle"),
            "user_input" => Some("blocked"),
            "stop" => Some("done"),
            _ => Some("working"),
        },
        _ => Some("working"),
    }
}
