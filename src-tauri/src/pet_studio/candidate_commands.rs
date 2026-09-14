use super::draft_commands::data_url;
use super::store;
use super::types::{AnimationRestoreView, ApproveAnimationRequest, AssembleRequest, AssetView};
use super::{with_draft, PetStudioState};
use std::fs;

#[tauri::command]
pub fn approve_pet_animation(
    request: ApproveAnimationRequest,
    state: tauri::State<'_, PetStudioState>,
) -> Result<AssetView, String> {
    let animation_id = store::flow_id(&request.animation_id, "Animation")?;
    let bytes = with_draft(&state, &request.draft_id, |draft| {
        let item = draft
            .animations
            .get_mut(&animation_id)
            .ok_or_else(|| "Create this APNG first.".to_string())?;
        let candidate_sheet = item
            .candidate_sheet
            .clone()
            .or_else(|| item.sheet.clone())
            .ok_or_else(|| "Generate this animation first.".to_string())?;
        let candidate_apng = item
            .candidate_apng
            .clone()
            .ok_or_else(|| "Create this APNG first.".to_string())?;
        let bytes =
            fs::read(&candidate_apng).map_err(|_| "Could not read the APNG.".to_string())?;
        item.candidate_sheet = None;
        item.candidate_apng = None;
        let old_sheet = item.sheet.replace(candidate_sheet);
        let retained_sheet = item.sheet.clone();
        let old_apng = item.apng.replace(candidate_apng);
        item.duration_ms = item
            .candidate_duration_ms
            .take()
            .unwrap_or(item.duration_ms);
        item.role = item
            .candidate_role
            .take()
            .unwrap_or_else(|| item.role.clone());
        if old_sheet != retained_sheet {
            if let Some(path) = old_sheet {
                let _ = fs::remove_file(path);
            }
        }
        if let Some(path) = old_apng {
            let _ = fs::remove_file(path);
        }
        Ok(bytes)
    })?;
    Ok(AssetView {
        data_url: data_url(&bytes),
    })
}

#[tauri::command]
pub fn discard_pet_animation_candidate(
    request: AssembleRequest,
    state: tauri::State<'_, PetStudioState>,
) -> Result<Option<AnimationRestoreView>, String> {
    let animation_id = store::flow_id(&request.animation_id, "Animation")?;
    let approved = with_draft(&state, &request.draft_id, |draft| {
        let item = draft
            .animations
            .get_mut(&animation_id)
            .ok_or_else(|| "Generate this animation first.".to_string())?;
        let candidate = item.candidate_sheet.take();
        let candidate_apng = item.candidate_apng.take();
        item.candidate_duration_ms = None;
        item.candidate_role = None;
        let approved = item.apng.clone().map(|apng| (apng, item.sheet.clone()));
        if approved.is_none() {
            draft.animations.remove(&animation_id);
        }
        if let Some(path) = candidate {
            let _ = fs::remove_file(path);
        }
        if let Some(path) = candidate_apng {
            let _ = fs::remove_file(path);
        }
        Ok(approved)
    })?;
    approved
        .map(|(apng, sheet)| {
            let bytes = fs::read(apng)
                .map_err(|_| "Could not restore the approved animation.".to_string())?;
            let sheet_data_url = sheet
                .map(|path| fs::read(path).map(|bytes| data_url(&bytes)))
                .transpose()
                .map_err(|_| "Could not restore the approved sprite sheet.".to_string())?;
            Ok(AnimationRestoreView {
                apng_data_url: data_url(&bytes),
                sheet_data_url,
            })
        })
        .transpose()
}
