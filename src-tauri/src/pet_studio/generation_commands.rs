use super::draft_commands::data_url;
use super::images;
use super::openai;
use super::sheet_layout;
use super::store;
use super::types::*;
use super::{with_draft, PetStudioState};
use std::fs;

#[tauri::command]
pub async fn generate_pet_reference(
    request: ReferenceRequest,
    state: tauri::State<'_, PetStudioState>,
) -> Result<AssetView, String> {
    let path = with_draft(&state, &request.draft_id, |draft| {
        if !draft.animations.is_empty() {
            return Err("Start a new draft to change an animated character reference.".into());
        }
        Ok(draft
            .directory
            .join(format!("reference-{}.png", uuid::Uuid::new_v4())))
    })?;
    let prompt = format!("Production 2D transparent desktop pet character reference. One complete character, centered, facing right, neutral standing pose, no floor, shadow, scenery, text, border, grid, or checkerboard. Preserve a clear compact silhouette suitable for animation. User design: {}", request.prompt.trim());
    let bytes = openai::generate(&prompt, &request.model, &request.quality).await?;
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
) -> Result<AnimationAssetView, String> {
    let animation_id = store::flow_id(&request.animation_id, "Animation")?;
    let (reference, output) = with_draft(&state, &request.draft_id, |draft| {
        let reference = draft
            .reference
            .as_ref()
            .ok_or_else(|| "Approve a character reference first.".to_string())?;
        Ok((
            fs::read(reference)
                .map_err(|_| "Could not read the character reference.".to_string())?,
            draft
                .directory
                .join(format!("{animation_id}-sheet-{}.png", uuid::Uuid::new_v4())),
        ))
    })?;
    let bytes = openai::edit(
        &animation_prompt(&request.prompt),
        &request.model,
        &request.quality,
        reference,
        sheet_layout::template_png()?,
    )
    .await?;
    images::split_sheet(&bytes)?;
    store::write_private(&output, &bytes)?;
    with_draft(&state, &request.draft_id, |draft| {
        draft
            .animations
            .entry(animation_id.clone())
            .and_modify(|animation| {
                if let Some(path) = animation.candidate_sheet.replace(output.clone()) {
                    let _ = fs::remove_file(path);
                }
                if let Some(path) = animation.candidate_apng.take() {
                    let _ = fs::remove_file(path);
                }
                animation.candidate_duration_ms = None;
                animation.candidate_role = None;
            })
            .or_insert(AnimationDraft {
                sheet: None,
                candidate_sheet: Some(output),
                candidate_apng: None,
                candidate_duration_ms: None,
                candidate_role: None,
                apng: None,
                duration_ms: 900,
                role: "stationary".into(),
            });
        Ok(())
    })?;
    Ok(AnimationAssetView {
        animation_id,
        data_url: data_url(&bytes),
    })
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
    let (sheet, output) = with_draft(&state, &request.draft_id, |draft| {
        let item = draft
            .animations
            .get(&animation_id)
            .ok_or_else(|| "Generate this animation first.".to_string())?;
        Ok((
            fs::read(
                item.candidate_sheet
                    .as_ref()
                    .or(item.sheet.as_ref())
                    .ok_or_else(|| "Generate this animation first.".to_string())?,
            )
            .map_err(|_| "Could not read the sprite sheet.".to_string())?,
            draft
                .directory
                .join(format!("{animation_id}-{}.png", uuid::Uuid::new_v4())),
        ))
    })?;
    let frames = images::split_sheet(&sheet)?;
    let bytes = images::encode_apng(&frames, request.duration_ms)?;
    store::write_private(&output, &bytes)?;
    with_draft(&state, &request.draft_id, |draft| {
        let item = draft.animations.get_mut(&animation_id).unwrap();
        if let Some(previous) = item.candidate_apng.replace(output) {
            let _ = fs::remove_file(previous);
        }
        item.candidate_duration_ms = Some(request.duration_ms);
        item.candidate_role = Some(request.role);
        Ok(())
    })?;
    Ok(AssetView {
        data_url: data_url(&bytes),
    })
}

fn animation_prompt(user: &str) -> String {
    format!("Production 2D animation sprite sheet for a transparent desktop pet. Image 1 is the exact character identity, costume, palette, proportions, equipment, linework, shading, scale, and facing reference. Image 2 is a rigid 2-column by 4-row layout template with eight empty outlined boxes, read left-to-right then top-to-bottom. Fill every box with exactly one complete successive animation frame. Keep every character, limb, prop, and effect comfortably inside its own box with clear transparent space at every edge; never let content cross or leak into a neighboring box. Keep the character centered on the same baseline and at the same scale. Return a clean transparent 1024x1536 sheet without the cyan template outlines, borders, labels, captions, floor, scenery, checkerboard, or cropped limbs. Eight successive frames form a smooth seamless loop. Preserve identity exactly; no redesign, camera movement, zoom, added limbs, or duplicated props. The physical action must read without motion symbols. Action: {}", user.trim())
}
