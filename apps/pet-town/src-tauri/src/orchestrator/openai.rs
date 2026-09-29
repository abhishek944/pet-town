use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize)]
struct LiveResponse {
    session: LiveSessionId,
    transport: LiveTransport,
}

#[derive(Deserialize)]
struct LiveSessionId {
    id: String,
}

#[derive(Deserialize)]
struct LiveTransport {
    r#type: String,
    sdp: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveAnswer {
    pub session_id: String,
    pub sdp: String,
}

pub fn api_key() -> Option<String> {
    if let Some(value) = super::credentials::keychain_key() {
        return Some(value);
    }
    if let Ok(value) = std::env::var("OPENAI_API_KEY") {
        if !value.trim().is_empty() {
            return Some(value);
        }
    }
    None
}

/// Starts a voice session with Responses delegation and backend tools.
pub async fn create_session(
    sdp: String,
    name: &str,
    system_prompt: &str,
) -> Result<LiveAnswer, String> {
    if sdp.len() > 2 * 1024 * 1024 {
        return Err("WebRTC offer is too large.".into());
    }
    let key = match api_key() {
        Some(key) => key,
        None => {
            return Err("OpenAI API key not found in Pet Town Keychain or the environment.".into())
        }
    };
    let instructions = super::launch::instructions(name, system_prompt);
    let responses_body = json!({
        "session": {
            "model": "gpt-live-1",
            "instructions": instructions,
            "delegation": {
                "type": "responses",
                "responses": {
                    "model": "gpt-5.6-luna",
                    "instructions": super::launch::instructions(name, system_prompt),
                    "reasoning": {"effort": "medium"},
                    "service_tier": "priority",
                    "tool_choice": "auto",
                    "parallel_tool_calls": false,
                    "tools": [
                        {
                            "type": "function",
                            "name": "run_firstmate_task",
                            "description": "Send computer work to the Mayor's persistent Firstmate primary agent. Pass the user's specific request and wait for its completed reply.",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "task": {"type": "string", "description": "The user's specific request to execute."}
                                },
                                "required": ["task"],
                                "additionalProperties": false
                            }
                        },
                        {
                            "type": "function",
                            "name": "cancel_firstmate_task",
                            "description": "Interrupt the currently running Firstmate task when the user asks to stop or cancel it.",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "reason": {"type": "string", "description": "Why the task should stop, in the user's words."}
                                },
                                "additionalProperties": false
                            }
                        }
                    ]
                }
            }
        },
        "transport": {"type": "webrtc", "sdp": sdp}
    });
    post_session(&key, &responses_body).await
}

async fn post_session(key: &str, body: &serde_json::Value) -> Result<LiveAnswer, String> {
    let response = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(10))
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|_| "Could not prepare GPT-Live networking.".to_string())?
        .post("https://api.openai.com/v1/live/sessions")
        .bearer_auth(key)
        .json(body)
        .send()
        .await
        .map_err(|error| {
            if error.is_timeout() {
                "GPT-Live tools connection timed out. Try connecting again.".to_string()
            } else {
                "Could not connect to GPT-Live tools. Check your connection and try again."
                    .to_string()
            }
        })?;
    if response.status() != reqwest::StatusCode::CREATED {
        let status = response.status();
        let detail = response
            .json::<serde_json::Value>()
            .await
            .ok()
            .and_then(|body| body["error"]["message"].as_str().map(str::to_string));
        return Err(match detail {
            Some(message) => format!("GPT-Live session creation failed: {message}"),
            None => format!(
                "GPT-Live session creation failed (HTTP {}).",
                status.as_u16()
            ),
        });
    }
    let live: LiveResponse = response
        .json()
        .await
        .map_err(|_| "GPT-Live returned an invalid session response.".to_string())?;
    if live.transport.r#type != "webrtc"
        || live.session.id.is_empty()
        || live.transport.sdp.is_empty()
    {
        return Err("GPT-Live returned an incomplete WebRTC session.".into());
    }
    Ok(LiveAnswer {
        session_id: live.session.id,
        sdp: live.transport.sdp,
    })
}

#[cfg(test)]
#[path = "openai_transport_tests.rs"]
mod tests;
