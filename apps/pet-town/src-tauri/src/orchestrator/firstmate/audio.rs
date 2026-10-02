//! OpenAI transcription and speech for the trusted Firstmate voice runtime.
use super::configured;
use base64::Engine;
use serde_json::Value;
use std::time::Duration;
use tauri::AppHandle;

fn key() -> Result<String, String> {
    super::super::openai::api_key().ok_or_else(|| "Add an OpenAI API key in Mayor settings.".into())
}

#[tauri::command]
pub async fn transcribe_firstmate_audio(
    audio: String,
    mime: String,
    app: AppHandle,
) -> Result<String, String> {
    configured(&app)?;
    let (filename, content_type) = if mime.starts_with("audio/webm") {
        ("speech.webm", "audio/webm")
    } else if mime.starts_with("audio/mp4") {
        ("speech.mp4", "audio/mp4")
    } else if mime.starts_with("audio/wav") {
        ("speech.wav", "audio/wav")
    } else {
        return Err("This microphone recording format is not supported.".into());
    };
    if audio.len() > 20_000_000 {
        return Err("Recording is too long. Try a shorter request.".into());
    }
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(audio)
        .map_err(|_| "Invalid microphone recording.".to_string())?;
    if bytes.is_empty() || bytes.len() > 15_000_000 {
        return Err("Recording is empty or too long.".into());
    }
    let boundary = format!("pet-town-{}", uuid::Uuid::new_v4().simple());
    let mut body = format!("--{boundary}\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\ngpt-transcribe\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n").into_bytes();
    body.extend(bytes);
    body.extend(format!("\r\n--{boundary}--\r\n").as_bytes());
    let response = reqwest::Client::new()
        .post("https://api.openai.com/v1/audio/transcriptions")
        .bearer_auth(key()?)
        .header(
            "Content-Type",
            format!("multipart/form-data; boundary={boundary}"),
        )
        .timeout(Duration::from_secs(60))
        .body(body)
        .send()
        .await
        .map_err(|_| "Speech transcription failed. Check your connection and retry.".to_string())?;
    if !response.status().is_success() {
        return Err(format!(
            "Speech transcription failed (HTTP {}).",
            response.status().as_u16()
        ));
    }
    let value: Value = response
        .json()
        .await
        .map_err(|_| "Invalid transcription reply.".to_string())?;
    value["text"]
        .as_str()
        .filter(|s| !s.trim().is_empty())
        .map(str::to_string)
        .ok_or_else(|| "No speech was recognized.".into())
}

#[tauri::command]
pub async fn speak_firstmate_text(text: String, app: AppHandle) -> Result<String, String> {
    configured(&app)?;
    if text.trim().is_empty() || text.chars().count() > 6000 {
        return Err("Reply is too long to speak.".into());
    }
    let client = reqwest::Client::new();
    let api_key = key()?;
    for attempt in 0..2 {
        let response = client.post("https://api.openai.com/v1/audio/speech")
            .bearer_auth(&api_key).json(&serde_json::json!({"model":"gpt-4o-mini-tts","voice":"alloy","input":text,"response_format":"mp3"}))
            .timeout(Duration::from_secs(90)).send().await;
        let response = match response {
            Ok(response) => response,
            Err(error) => {
                eprintln!("[mayor speech] request failed: {error}");
                if attempt == 0 {
                    continue;
                }
                return Err("Could not generate spoken reply.".into());
            }
        };
        if !response.status().is_success() {
            return Err(format!(
                "Spoken reply failed (HTTP {}).",
                response.status().as_u16()
            ));
        }
        match response.bytes().await {
            Ok(bytes) => {
                if bytes.len() > 12_000_000 {
                    return Err("Spoken reply is too large.".into());
                }
                return Ok(base64::engine::general_purpose::STANDARD.encode(bytes));
            }
            Err(error) => {
                eprintln!("[mayor speech] audio download failed: {error}");
                if attempt == 0 {
                    continue;
                }
            }
        }
    }
    Err("Could not read spoken reply.".into())
}
