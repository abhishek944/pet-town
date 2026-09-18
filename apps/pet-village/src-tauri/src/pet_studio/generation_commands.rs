use super::draft_commands::data_url;
use super::types::*;
use super::{
    animation_generation, generation_worker, images, store, with_draft, worker_registry,
    PetStudioState,
};
use std::fs;

#[tauri::command]
pub async fn generate_pet_reference(
    request: ReferenceRequest,
    state: tauri::State<'_, PetStudioState>,
) -> Result<AssetView, String> {
    let (path, directory) = with_draft(&state, &request.draft_id, |draft| {
        if !draft.animations.is_empty() {
            return Err("Start a new draft to change an animated character reference.".into());
        }
        Ok((
            draft
                .directory
                .join(format!("reference-{}.png", uuid::Uuid::new_v4())),
            draft.directory.clone(),
        ))
    })?;
    let _generation = worker_registry::GenerationGuard::begin(&directory)?;
    let prompt = format!(
        "Production 2D transparent desktop pet character reference. One complete character, centered, facing right, neutral standing pose, no floor, shadow, scenery, text, border, grid, or checkerboard. Preserve a clear compact silhouette suitable for animation. User design: {}",
        request.prompt.trim()
    );
    let bytes =
        generation_worker::reference(directory, prompt, request.model, request.quality).await?;
    if _generation.cancelled() {
        return Err("Reference generation was cancelled.".into());
    }
    images::validate_png(&bytes)?;
    store::write_private(&path, &bytes)?;
    with_draft(&state, &request.draft_id, |draft| {
        draft.reference = Some(path);
        Ok(())
    })?;
    Ok(AssetView {
        data_url: data_url(&bytes),
    })
}

#[tauri::command]
pub async fn generate_pet_animation(
    request: AnimationRequest,
    state: tauri::State<'_, PetStudioState>,
) -> Result<AnimationFramesView, String> {
    animation_generation::generate(request, &state).await
}

#[tauri::command]
pub fn assemble_pet_animation(
    request: AssembleRequest,
    state: tauri::State<'_, PetStudioState>,
) -> Result<AssetView, String> {
    if request.role != "stationary" && request.role != "locomotion" {
        return Err("Choose stationary or locomotion for this animation.".into());
    }
    let animation_id = store::flow_id(&request.animation_id, "Animation")?;
    let directory = with_draft(&state, &request.draft_id, |draft| {
        Ok(draft.directory.clone())
    })?;
    let _assembly = worker_registry::GenerationGuard::begin(&directory)?;
    let (inputs, output, source_paths, generation_id) = with_draft(
        &state,
        &request.draft_id,
        |draft| {
            let item = draft
                .animations
                .get(&animation_id)
                .ok_or_else(|| "Generate this animation first.".to_string())?;
            let paths = item
                .candidate_frames
                .as_ref()
                .or(item.frames.as_ref())
                .ok_or_else(|| "Generate all six animation frames first.".to_string())?;
            if item.candidate_role.as_deref() != Some(request.role.as_str()) {
                return Err("The animation kind changed after frame generation. Restore it or regenerate the six frames.".into());
            }
            let inputs = paths
                .iter()
                .map(fs::read)
                .collect::<Result<Vec<_>, _>>()
                .map_err(|_| "Could not read a generated animation frame.".to_string())?;
            Ok((
                inputs,
                draft
                    .directory
                    .join(format!("{animation_id}-{}.png", uuid::Uuid::new_v4())),
                paths.clone(),
                item.candidate_generation_id.clone(),
            ))
        },
    )?;
    let frames = images::prepare_frames(&inputs)?;
    let bytes = images::encode_apng(&frames, request.duration_ms)?;
    store::write_private(&output, &bytes)?;
    let installed = with_draft(&state, &request.draft_id, |draft| {
        let item = draft
            .animations
            .get_mut(&animation_id)
            .ok_or_else(|| "This animation draft is no longer available.".to_string())?;
        if item.candidate_frames.as_ref() != Some(&source_paths)
            || item.candidate_generation_id != generation_id
            || item.candidate_role.as_deref() != Some(request.role.as_str())
        {
            return Ok(false);
        }
        if let Some(previous) = item.candidate_apng.replace(output.clone()) {
            let _ = fs::remove_file(previous);
        }
        item.candidate_duration_ms = Some(request.duration_ms);
        item.candidate_role = Some(request.role);
        Ok(true)
    });
    if !matches!(installed, Ok(true)) {
        let _ = fs::remove_file(output);
        return installed.and_then(|_| {
            Err("The animation frames changed while the APNG was being created.".into())
        });
    }
    Ok(AssetView {
        data_url: data_url(&bytes),
    })
}
