use super::draft_commands::data_url;
use super::store;
use super::types::{
    AnimationFramesView, AnimationRestoreView, ApproveAnimationRequest, AssembleRequest, AssetView,
};
use super::{with_draft, PetStudioState};
use std::fs;
use std::path::PathBuf;

fn remove_paths(paths: Option<Vec<PathBuf>>) {
    for path in paths.into_iter().flatten() {
        let _ = fs::remove_file(path);
    }
}

#[tauri::command]
pub fn get_pet_animation_candidate(
    request: ApproveAnimationRequest,
    state: tauri::State<'_, PetStudioState>,
) -> Result<Option<AnimationFramesView>, String> {
    let animation_id = store::flow_id(&request.animation_id, "Animation")?;
    with_draft(&state, &request.draft_id, |draft| {
        let Some(item) = draft.animations.get(&animation_id) else {
            return Ok(None);
        };
        let Some(paths) = item.candidate_frames.as_ref() else {
            return Ok(None);
        };
        let role = item
            .candidate_role
            .clone()
            .unwrap_or_else(|| item.role.clone());
        let data_urls = paths
            .iter()
            .map(|path| fs::read(path).map(|bytes| data_url(&bytes)))
            .collect::<Result<Vec<_>, _>>()
            .map_err(|_| "Could not read the saved animation frames.".to_string())?;
        Ok(Some(AnimationFramesView {
            animation_id,
            role,
            data_urls,
        }))
    })
}

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
        let candidate_frames = item
            .candidate_frames
            .clone()
            .or_else(|| item.frames.clone())
            .ok_or_else(|| "Generate this animation first.".to_string())?;
        let candidate_apng = item
            .candidate_apng
            .clone()
            .ok_or_else(|| "Create this APNG first.".to_string())?;
        let bytes =
            fs::read(&candidate_apng).map_err(|_| "Could not read the APNG.".to_string())?;
        item.candidate_frames = None;
        item.candidate_signature = None;
        item.candidate_generation_id = None;
        item.candidate_apng = None;
        let old_frames = item.frames.replace(candidate_frames);
        let retained_frames = item.frames.clone();
        let old_apng = item.apng.replace(candidate_apng);
        item.duration_ms = item
            .candidate_duration_ms
            .take()
            .unwrap_or(item.duration_ms);
        item.role = item
            .candidate_role
            .take()
            .unwrap_or_else(|| item.role.clone());
        if old_frames != retained_frames {
            remove_paths(old_frames);
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
        let candidate = item.candidate_frames.take();
        item.candidate_signature = None;
        item.candidate_generation_id = None;
        let candidate_apng = item.candidate_apng.take();
        item.candidate_duration_ms = None;
        item.candidate_role = None;
        let approved = item.apng.clone().map(|apng| (apng, item.frames.clone()));
        if approved.is_none() {
            draft.animations.remove(&animation_id);
        }
        remove_paths(candidate);
        if let Some(path) = candidate_apng {
            let _ = fs::remove_file(path);
        }
        Ok(approved)
    })?;
    approved
        .map(|(apng, frames)| {
            let bytes = fs::read(apng)
                .map_err(|_| "Could not restore the approved animation.".to_string())?;
            let frame_data_urls = frames
                .into_iter()
                .flatten()
                .map(|path| fs::read(path).map(|bytes| data_url(&bytes)))
                .collect::<Result<Vec<_>, _>>()
                .map_err(|_| "Could not restore the approved animation frames.".to_string())?;
            Ok(AnimationRestoreView {
                apng_data_url: data_url(&bytes),
                frame_data_urls,
            })
        })
        .transpose()
}
