use super::draft_commands::data_url;
use super::types::{AnimationDraft, AnimationFramesView, AnimationRequest};
use super::{generation_worker, store, with_draft, worker_registry, PetStudioState};
use std::fs;
use std::path::PathBuf;

const SPRITE_PROMPT_VERSION: u8 = 3;
const FRAME_COUNT: usize = 6;

struct CandidateOwnership {
    signature: Option<String>,
    generation_id: Option<String>,
}

fn remove_paths(paths: Option<Vec<PathBuf>>) {
    for path in paths.into_iter().flatten() {
        let _ = fs::remove_file(path);
    }
}

pub async fn generate(
    request: AnimationRequest,
    state: &PetStudioState,
) -> Result<AnimationFramesView, String> {
    let animation_id = store::flow_id(&request.animation_id, "Animation")?;
    if request.role != "stationary" && request.role != "locomotion" {
        return Err("Choose stationary or locomotion for this animation.".into());
    }
    let directory = with_draft(state, &request.draft_id, |draft| {
        Ok(draft.directory.clone())
    })?;
    let _generation = worker_registry::GenerationGuard::begin(&directory)?;
    let signature = format!(
        "v{SPRITE_PROMPT_VERSION}\0{}\0{}\0{}\0{}",
        request.prompt.trim(),
        request.role,
        request.model,
        request.quality
    );
    let generation_id = uuid::Uuid::new_v4().to_string();
    let (reference, previous) = with_draft(state, &request.draft_id, |draft| {
        let reference = draft
            .reference
            .clone()
            .ok_or_else(|| "Approve a character reference first.".to_string())?;
        let item = draft
            .animations
            .entry(animation_id.clone())
            .or_insert(AnimationDraft {
                frames: None,
                candidate_frames: None,
                candidate_signature: None,
                candidate_generation_id: None,
                candidate_apng: None,
                candidate_duration_ms: None,
                candidate_role: None,
                apng: None,
                duration_ms: 900,
                role: "stationary".into(),
            });
        let previous = CandidateOwnership {
            signature: item.candidate_signature.replace(signature.clone()),
            generation_id: item.candidate_generation_id.replace(generation_id.clone()),
        };
        Ok((reference, previous))
    })?;
    let frames = match generation_worker::sprite(generation_worker::SpriteRequest {
        directory: directory.clone(),
        reference,
        animation_id: animation_id.clone(),
        prompt: request.prompt.clone(),
        role: request.role.clone(),
        model: request.model.clone(),
        quality: request.quality.clone(),
    })
    .await
    {
        Ok(frames) => frames,
        Err(error) => {
            restore_candidate(
                state,
                &request.draft_id,
                &animation_id,
                &generation_id,
                &previous,
            );
            return Err(error);
        }
    };
    if _generation.cancelled() {
        restore_candidate(
            state,
            &request.draft_id,
            &animation_id,
            &generation_id,
            &previous,
        );
        return Err("Animation generation was cancelled.".into());
    }
    let paths = match write_frames(&directory, &animation_id, &frames) {
        Ok(paths) => paths,
        Err(error) => {
            restore_candidate(
                state,
                &request.draft_id,
                &animation_id,
                &generation_id,
                &previous,
            );
            return Err(error);
        }
    };
    let replaced = with_draft(state, &request.draft_id, |draft| {
        let item = draft
            .animations
            .get_mut(&animation_id)
            .ok_or_else(|| "This animation draft is no longer available.".to_string())?;
        if item.candidate_signature.as_deref() != Some(&signature)
            || item.candidate_generation_id.as_deref() != Some(&generation_id)
        {
            return Ok(None);
        }
        let old_frames = item.candidate_frames.replace(paths.clone());
        let old_apng = item.candidate_apng.take();
        item.candidate_duration_ms = None;
        item.candidate_role = Some(request.role.clone());
        Ok(Some((old_frames, old_apng)))
    });
    let replaced = match replaced {
        Ok(Some(replaced)) => replaced,
        Ok(None) => {
            remove_paths(Some(paths));
            return Err("Animation generation was replaced by a newer request.".into());
        }
        Err(error) => {
            remove_paths(Some(paths));
            return Err(error);
        }
    };
    remove_paths(replaced.0);
    if let Some(path) = replaced.1 {
        let _ = fs::remove_file(path);
    }
    Ok(AnimationFramesView {
        animation_id,
        role: request.role,
        data_urls: frames.iter().map(|bytes| data_url(bytes)).collect(),
    })
}

fn write_frames(
    directory: &std::path::Path,
    animation_id: &str,
    frames: &[Vec<u8>],
) -> Result<Vec<PathBuf>, String> {
    if frames.len() != FRAME_COUNT {
        return Err("The image worker did not return six animation frames.".into());
    }
    let mut paths = Vec::with_capacity(FRAME_COUNT);
    for (index, bytes) in frames.iter().enumerate() {
        let path = directory.join(format!(
            "{animation_id}-frame-{}-{}.png",
            index + 1,
            uuid::Uuid::new_v4()
        ));
        if let Err(error) = store::write_private(&path, bytes) {
            remove_paths(Some(paths));
            return Err(error);
        }
        paths.push(path);
    }
    Ok(paths)
}

fn restore_candidate(
    state: &PetStudioState,
    draft_id: &str,
    animation_id: &str,
    generation_id: &str,
    previous: &CandidateOwnership,
) {
    let _ = with_draft(state, draft_id, |draft| {
        let remove = draft.animations.get_mut(animation_id).is_some_and(|item| {
            if item.candidate_generation_id.as_deref() != Some(generation_id) {
                return false;
            }
            item.candidate_signature = previous.signature.clone();
            item.candidate_generation_id = previous.generation_id.clone();
            item.candidate_frames.is_none() && item.apng.is_none() && item.frames.is_none()
        });
        if remove {
            draft.animations.remove(animation_id);
        }
        Ok(())
    });
}
