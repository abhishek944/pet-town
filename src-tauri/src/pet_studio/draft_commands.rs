use super::images;
use super::store;
use super::types::*;
use super::{with_draft, PetStudioState};
use base64::Engine;
use std::collections::HashMap;
use std::fs;

#[tauri::command]
pub fn pet_studio_status() -> ApiStatus {
    let available = crate::orchestrator::openai::api_key().is_some();
    ApiStatus {
        available,
        source: available.then_some("environment or Keychain"),
        models: MODELS,
        message: if available {
            "OpenAI API key found. Generation is available, subject to account access and quota."
        } else {
            "OpenAI API key not found in the environment or Pet Village Keychain entry."
        },
    }
}

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
        reference: None,
        animations: HashMap::new(),
        extension_candidates: vec![],
    };
    let mut drafts = state.0.lock().unwrap_or_else(|error| error.into_inner());
    if drafts.len() >= 8 {
        if let Some(expired) = drafts
            .keys()
            .next()
            .cloned()
            .and_then(|key| drafts.remove(&key))
        {
            let _ = fs::remove_dir_all(expired.directory);
        }
    }
    drafts.insert(id.clone(), draft);
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
pub fn set_pet_reference(
    request: ReferenceUpload,
    state: tauri::State<'_, PetStudioState>,
) -> Result<AssetView, String> {
    let bytes = decode_data_url(&request.png_data_url)?;
    images::validate_png(&bytes)?;
    let path = with_draft(&state, &request.draft_id, |draft| {
        if !draft.animations.is_empty() {
            return Err("Start a new draft to change an animated character reference.".into());
        }
        Ok(draft
            .directory
            .join(format!("reference-{}.png", uuid::Uuid::new_v4())))
    })?;
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
pub fn import_pet_animation(
    request: AnimationUpload,
    state: tauri::State<'_, PetStudioState>,
) -> Result<AnimationAssetView, String> {
    let animation_id = store::flow_id(&request.animation_id, "Animation")?;
    if !matches!(request.role.as_str(), "locomotion" | "stationary") {
        return Err("Choose a valid animation role.".into());
    }
    let bytes = decode_data_url(&request.apng_data_url)?;
    let duration_ms = super::apng::validate(&bytes)?;
    with_draft(&state, &request.draft_id, |draft| {
        let path = draft
            .directory
            .join(format!("{animation_id}-{}.png", uuid::Uuid::new_v4()));
        store::write_private(&path, &bytes)?;
        if let Some(previous) = draft.animations.insert(
            animation_id.clone(),
            AnimationDraft {
                sheet: None,
                candidate_sheet: None,
                candidate_apng: None,
                candidate_duration_ms: None,
                candidate_role: None,
                apng: Some(path),
                duration_ms,
                role: request.role,
            },
        ) {
            if let Some(path) = previous.sheet {
                let _ = fs::remove_file(path);
            }
            if let Some(path) = previous.apng {
                let _ = fs::remove_file(path);
            }
            if let Some(path) = previous.candidate_sheet {
                let _ = fs::remove_file(path);
            }
            if let Some(path) = previous.candidate_apng {
                let _ = fs::remove_file(path);
            }
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
        .ok_or_else(|| "Reference must be PNG or APNG image data.".to_string())?;
    if encoded.len() > MAX_IMAGE_BYTES * 2 {
        return Err("Reference image is too large.".into());
    }
    base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .map_err(|_| "Reference image data is invalid.".to_string())
}
