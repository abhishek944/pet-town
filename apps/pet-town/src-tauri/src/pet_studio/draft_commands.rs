use super::store;
use super::types::*;
use super::{with_draft, PetStudioState};
use base64::Engine;
use std::collections::HashMap;
use std::fs;

#[tauri::command]
pub fn create_pet_draft(
    request: CreateDraftRequest,
    state: tauri::State<'_, PetStudioState>,
) -> Result<DraftView, String> {
    let display_name = request.display_name.trim();
    if display_name.is_empty() || display_name.len() > 64 {
        return Err("Pet name must contain 1–64 characters.".into());
    }
    let id = uuid::Uuid::new_v4().to_string();
    let directory = state
        .1
        .as_ref()
        .ok_or_else(|| "Pet Studio storage is unavailable.".to_string())?
        .join(&id);
    store::create_private_dir(&directory)?;
    let draft = Draft {
        id: id.clone(),
        directory,
        animations: HashMap::new(),
        extension_candidates: vec![],
    };
    let expired = {
        let mut drafts = state.0.lock().unwrap_or_else(|error| error.into_inner());
        let expired = (drafts.len() >= 8)
            .then(|| drafts.keys().next().cloned())
            .flatten()
            .and_then(|key| drafts.remove(&key));
        drafts.insert(id.clone(), draft);
        expired
    };
    if let Some(expired) = expired {
        let _ = fs::remove_dir_all(expired.directory);
    }
    Ok(DraftView {
        draft_id: id,
        display_name: display_name.to_string(),
    })
}

#[tauri::command]
pub fn discard_pet_draft(
    request: DiscardDraftRequest,
    state: tauri::State<'_, PetStudioState>,
) -> Result<DiscardDraftResult, String> {
    let draft = state
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .remove(&request.draft_id);
    let mut cleanup_warning = None;
    if let Some(draft) = draft {
        for candidate in draft.extension_candidates {
            let _ =
                super::extension_activation::discard(&candidate.base_id, &candidate.candidate_id);
        }
        cleanup_warning = match fs::remove_dir_all(draft.directory) {
            Ok(()) => None,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => None,
            Err(_) => {
                Some("Draft discarded, but some temporary files could not be removed.".to_string())
            }
        };
    }
    Ok(DiscardDraftResult { cleanup_warning })
}

#[tauri::command]
pub fn import_pet_animation(
    request: AnimationUpload,
    state: tauri::State<'_, PetStudioState>,
) -> Result<AnimationAssetView, String> {
    let animation_id = store::flow_id(&request.animation_id, "Animation")?;
    if !matches!(request.role.as_str(), "locomotion" | "stationary") {
        return Err("Choose a valid animation role.".into());
    }
    let bytes = decode_data_url(&request.apng_data_url)?;
    let duration_ms = super::apng::validate_import(&bytes)?;
    with_draft(&state, &request.draft_id, |draft| {
        let path = draft
            .directory
            .join(format!("{animation_id}-{}.png", uuid::Uuid::new_v4()));
        store::write_private(&path, &bytes)?;
        if let Some(previous) = draft.animations.insert(
            animation_id.clone(),
            AnimationDraft {
                apng: path,
                duration_ms,
                role: request.role,
            },
        ) {
            let _ = fs::remove_file(previous.apng);
        }
        Ok(())
    })?;
    Ok(AnimationAssetView {
        animation_id,
        data_url: data_url(&bytes),
    })
}

pub fn data_url(bytes: &[u8]) -> String {
    format!(
        "data:image/png;base64,{}",
        base64::engine::general_purpose::STANDARD.encode(bytes)
    )
}

fn decode_data_url(value: &str) -> Result<Vec<u8>, String> {
    let encoded = value
        .strip_prefix("data:image/png;base64,")
        .or_else(|| value.strip_prefix("data:image/apng;base64,"))
        .ok_or_else(|| "Animation must be PNG or APNG image data.".to_string())?;
    if encoded.len() > MAX_IMAGE_BYTES * 2 {
        return Err("Animation image is too large.".into());
    }
    base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .map_err(|_| "Animation image data is invalid.".to_string())
}
