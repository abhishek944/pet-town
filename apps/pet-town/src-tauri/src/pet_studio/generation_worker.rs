use super::{generated_frame_validation, generation_artifacts, generation_process, images};
use serde_json::json;
use std::path::PathBuf;

const FRAME_COUNT: usize = 6;

pub async fn reference(
    directory: PathBuf,
    prompt: String,
    model: String,
    quality: String,
) -> Result<Vec<u8>, String> {
    generation_process::validate_request(&model, &quality, &prompt, 32_000)?;
    tauri::async_runtime::spawn_blocking(move || {
        let result = generation_process::execute(
            &directory,
            json!({"operation":"reference","prompt":prompt,"model":model,"quality":quality}),
        )?;
        if result.operation != "reference" || result.model != model || result.provider != "openai" {
            return Err("The image worker returned an unexpected result.".into());
        }
        let bytes = generation_artifacts::read_image(
            &directory,
            result
                .path
                .as_deref()
                .ok_or_else(|| "The image worker returned no reference image.".to_string())?,
        )?;
        images::validate_png(&bytes)?;
        Ok(bytes)
    })
    .await
    .map_err(|_| "The image-generation worker stopped unexpectedly.".to_string())?
}

pub struct SpriteRequest {
    pub directory: PathBuf,
    pub reference: PathBuf,
    pub animation_id: String,
    pub prompt: String,
    pub role: String,
    pub model: String,
    pub quality: String,
}

pub async fn sprite(request: SpriteRequest) -> Result<Vec<Vec<u8>>, String> {
    generation_process::validate_request(
        &request.model,
        &request.quality,
        &request.prompt,
        19_000,
    )?;
    let reference = request
        .reference
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "The character reference path is invalid.".to_string())?
        .to_string();
    let directory = request.directory.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let result = generation_process::execute(
            &directory,
            json!({
                "operation":"sprite",
                "prompt":request.prompt,
                "role":request.role,
                "model":request.model,
                "quality":request.quality,
                "reference":reference,
                "filename":request.animation_id,
            }),
        )?;
        if result.operation != "sprite"
            || result.model != request.model
            || result.provider != "openai"
        {
            return Err("The image worker returned an unexpected result.".into());
        }
        let run_directory = generation_artifacts::safe_directory(
            &directory,
            result
                .run_directory
                .as_deref()
                .ok_or_else(|| "The image worker returned no run directory.".to_string())?,
        )?;
        let raw_sheet = generation_artifacts::safe_artifact(
            &directory,
            result
                .raw_sheet
                .as_deref()
                .ok_or_else(|| "The image worker returned no source sheet.".to_string())?,
        )?;
        if !raw_sheet.starts_with(&run_directory) {
            return Err("The image worker returned a mismatched source sheet path.".into());
        }
        let manifest = generation_artifacts::safe_artifact(
            &directory,
            &run_directory.join("pipeline-meta.json"),
        )?;
        if std::fs::metadata(manifest)
            .map_err(|_| "Could not inspect the sprite metadata.".to_string())?
            .len()
            > 1024 * 1024
        {
            return Err("The sprite metadata is unexpectedly large.".into());
        }
        let validation = result
            .validation
            .ok_or_else(|| "The image worker returned no validation result.".to_string())?;
        if !validation.accepted {
            let detail = validation
                .issues
                .iter()
                .find(|issue| issue.severity == "error")
                .map(|issue| issue.message.as_str())
                .unwrap_or("The generated sheet did not pass animation checks.");
            return Err(format!("{detail} No automatic retry was made."));
        }
        let normalized_sheet = generation_artifacts::safe_artifact(
            &directory,
            result
                .normalized_sheet
                .as_deref()
                .ok_or_else(|| "The image worker returned no normalized sheet.".to_string())?,
        )?;
        if !normalized_sheet.starts_with(&run_directory) {
            return Err("The image worker returned a mismatched normalized sheet path.".into());
        }
        let mut frames = result
            .frames
            .ok_or_else(|| "The image worker returned no animation frames.".to_string())?;
        frames.sort_by_key(|frame| frame.index);
        if frames.len() != FRAME_COUNT
            || frames.iter().enumerate().any(|(index, frame)| {
                frame.index != index + 1 || frame.width != 512 || frame.height != 512
            })
        {
            return Err("The image worker returned an invalid six-frame layout.".into());
        }
        let frames_directory = run_directory.join("frames");
        let bytes = frames
            .iter()
            .map(|frame| {
                let path = generation_artifacts::safe_artifact(&directory, &frame.path)?;
                if !path.starts_with(&frames_directory) {
                    return Err("The image worker returned a mismatched frame path.".into());
                }
                generation_artifacts::read_image(&directory, &path)
            })
            .collect::<Result<Vec<_>, _>>()?;
        generated_frame_validation::validate(&bytes, true)?;
        images::prepare_frames(&bytes)?;
        Ok(bytes)
    })
    .await
    .map_err(|_| "The image-generation worker stopped unexpectedly.".to_string())?
}
