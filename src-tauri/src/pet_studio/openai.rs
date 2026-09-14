use super::types::{MAX_IMAGE_BYTES, MODELS};
use base64::Engine;
use reqwest::{multipart, Client, StatusCode};
use serde::Deserialize;
use std::time::Duration;

#[derive(Deserialize)]
struct ImagesResponse {
    data: Vec<ImageResult>,
}
#[derive(Deserialize)]
struct ImageResult {
    b64_json: Option<String>,
}

fn client() -> Result<Client, String> {
    Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(180))
        .build()
        .map_err(|_| "Could not prepare the image service.".to_string())
}

fn validate(model: &str, quality: &str, prompt: &str) -> Result<(), String> {
    if !MODELS.contains(&model) {
        return Err("Choose one of the supported GPT Image 2.5 models.".into());
    }
    if !["low", "medium", "high", "xhigh", "max"].contains(&quality) {
        return Err("Choose a supported image quality.".into());
    }
    if prompt.trim().is_empty() || prompt.chars().count() > 32_000 {
        return Err("Enter an image prompt of at most 32,000 characters.".into());
    }
    Ok(())
}

fn key() -> Result<String, String> {
    crate::orchestrator::openai::api_key().ok_or_else(|| {
        "OpenAI API key not found in the environment or Pet Village Keychain entry.".into()
    })
}

async fn decode(response: reqwest::Response) -> Result<Vec<u8>, String> {
    let status = response.status();
    if !status.is_success() {
        return Err(match status {
            StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => {
                "OpenAI rejected the API key or model access."
            }
            StatusCode::TOO_MANY_REQUESTS => "OpenAI rate limit or account quota was reached.",
            code if code.is_server_error() => "OpenAI is temporarily unavailable.",
            _ => "OpenAI could not generate this image.",
        }
        .into());
    }
    let body = response
        .bytes()
        .await
        .map_err(|_| "OpenAI returned an incomplete response.".to_string())?;
    if body.len() > MAX_IMAGE_BYTES * 2 {
        return Err("OpenAI returned an unexpectedly large response.".into());
    }
    let parsed: ImagesResponse = serde_json::from_slice(&body)
        .map_err(|_| "OpenAI returned an invalid image response.".to_string())?;
    let encoded = parsed
        .data
        .into_iter()
        .next()
        .and_then(|item| item.b64_json)
        .ok_or_else(|| "OpenAI returned no usable image.".to_string())?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .map_err(|_| "OpenAI returned invalid image data.".to_string())?;
    if bytes.len() > MAX_IMAGE_BYTES {
        return Err("Generated image exceeds the 20 MB limit.".into());
    }
    Ok(bytes)
}

pub async fn generate(prompt: &str, model: &str, quality: &str) -> Result<Vec<u8>, String> {
    validate(model, quality, prompt)?;
    let response = client()?.post("https://api.openai.com/v1/images/generations")
        .bearer_auth(key()?)
        .json(&serde_json::json!({"model":model,"prompt":prompt,"n":1,"size":"1024x1536","quality":quality,"background":"transparent","output_format":"png"}))
        .send().await.map_err(|_| "Could not connect to OpenAI.".to_string())?;
    decode(response).await
}

pub async fn edit(
    prompt: &str,
    model: &str,
    quality: &str,
    reference: Vec<u8>,
) -> Result<Vec<u8>, String> {
    validate(model, quality, prompt)?;
    if reference.len() > MAX_IMAGE_BYTES {
        return Err("Reference image exceeds the 20 MB limit.".into());
    }
    let image = multipart::Part::bytes(reference)
        .file_name("reference.png")
        .mime_str("image/png")
        .map_err(|_| "Could not prepare the reference image.".to_string())?;
    let form = multipart::Form::new()
        .text("model", model.to_string())
        .text("prompt", prompt.to_string())
        .text("n", "1")
        .text("size", "1024x1536")
        .text("quality", quality.to_string())
        .text("background", "transparent")
        .text("output_format", "png")
        .part("image", image);
    let response = client()?
        .post("https://api.openai.com/v1/images/edits")
        .bearer_auth(key()?)
        .multipart(form)
        .send()
        .await
        .map_err(|_| "Could not connect to OpenAI.".to_string())?;
    decode(response).await
}
