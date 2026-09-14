use super::store::{create_private_dir, flow_id, pack_id, root, secure_dir, write_private};
use super::types::{Draft, PetExtensionCandidateView, SaveExtensionRequest, StoredPetExtension};
use base64::Engine;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, HashMap};
use std::fs;

fn state_flow(animation: &str) -> Value {
    json!({"completion":"restart","flow":{"type":"sequence","steps":[
        {"type":"play","clip":animation},{"type":"wait","durationMs":300}
    ]}})
}

fn decode_asset(value: &str) -> Result<Vec<u8>, String> {
    let encoded = value
        .strip_prefix("data:image/png;base64,")
        .or_else(|| value.strip_prefix("data:image/apng;base64,"))
        .ok_or_else(|| "Stored pet extension asset is invalid.".to_string())?;
    base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .map_err(|_| "Stored pet extension asset is invalid.".to_string())
}

fn internal_name(draft: &Draft, name: &str) -> String {
    let digest = hex::encode(Sha256::digest(format!("{}:{name}", draft.id).as_bytes()));
    format!(
        "studio-{}-{}",
        &digest[..12],
        name.chars().take(28).collect::<String>()
    )
}

pub fn stage(
    request: &SaveExtensionRequest,
    draft: &Draft,
) -> Result<PetExtensionCandidateView, String> {
    let base_id = pack_id(&request.base_id)?;
    if !crate::preferences_state::installed_pet_ids()
        .iter()
        .any(|id| id == &base_id)
    {
        return Err("Choose an installed pet to extend.".into());
    }
    let previous = super::extension_catalog::get(&base_id)?;
    let parent_version = previous
        .as_ref()
        .map(|value| value.extension_version.clone());
    let mut clips = previous
        .as_ref()
        .map(|value| value.clips.clone())
        .unwrap_or_default();
    let mut states = previous
        .as_ref()
        .map(|value| value.states.clone())
        .unwrap_or_default();
    let mut actions = previous
        .as_ref()
        .map(|value| value.actions.clone())
        .unwrap_or_default();
    let mut assets = previous
        .as_ref()
        .map(|value| {
            value
                .assets
                .iter()
                .map(|(name, data)| decode_asset(data).map(|bytes| (name.clone(), bytes)))
                .collect::<Result<BTreeMap<_, _>, _>>()
        })
        .transpose()?
        .unwrap_or_default();

    let mut names = HashMap::new();
    for (name, animation) in &draft.animations {
        let Some(path) = animation.apng.as_ref() else {
            continue;
        };
        let internal = internal_name(draft, name);
        let bytes = fs::read(path).map_err(|_| "Could not stage an animation.".to_string())?;
        clips.insert(internal.clone(), json!({"asset":format!("assets/{internal}.png"),
            "durationMs":animation.duration_ms,"role":animation.role,"sourceFacing":"right","mirror":true}));
        assets.insert(format!("assets/{internal}.png"), bytes);
        names.insert(name.clone(), internal);
    }
    if names.is_empty() {
        return Err("Approve at least one new APNG before saving this extension.".into());
    }
    for (state, animation) in &request.state_assignments {
        if !matches!(
            state.as_str(),
            "idle" | "working" | "blocked" | "done" | "unknown"
        ) {
            return Err("Choose a valid pet state to replace.".into());
        }
        let internal = names
            .get(animation)
            .ok_or_else(|| format!("Animation {animation} is not approved in this draft."))?;
        states.insert(state.clone(), state_flow(internal));
    }
    for action in &request.actions {
        let action_id = flow_id(&action.id, "Action")?;
        if action.label.trim().is_empty() || action.label.len() > 24 {
            return Err("Action labels must contain 1–24 characters.".into());
        }
        let internal = names.get(&action.animation_id).ok_or_else(|| {
            format!(
                "Animation {} is not approved in this draft.",
                action.animation_id
            )
        })?;
        actions.insert(
            action_id,
            json!({"label":action.label.trim(),"flow":{"type":"play","clip":internal}}),
        );
    }
    if actions.len() > 8 {
        return Err("A pet can have at most eight menu actions.".into());
    }

    let extension_version = uuid::Uuid::new_v4().to_string();
    let extension = StoredPetExtension {
        format_version: 1,
        base_id: base_id.clone(),
        extension_version: extension_version.clone(),
        parent_extension_version: parent_version,
        draft_id: Some(draft.id.clone()),
        clips,
        states,
        actions,
    };
    let version_directory = root()?
        .join("extensions")
        .join(&base_id)
        .join("versions")
        .join(&extension_version);
    create_private_dir(version_directory.parent().unwrap())?;
    fs::create_dir(&version_directory)
        .map_err(|_| "Could not create pet extension staging.".to_string())?;
    secure_dir(&version_directory)?;
    let result = (|| {
        create_private_dir(&version_directory.join("assets"))?;
        let mut asset_hashes = BTreeMap::new();
        for (name, bytes) in &assets {
            write_private(&version_directory.join(name), bytes)?;
            asset_hashes.insert(name.clone(), hex::encode(Sha256::digest(bytes)));
        }
        let extension_bytes = serde_json::to_vec_pretty(&extension)
            .map_err(|_| "Could not encode the pet extension.".to_string())?;
        write_private(&version_directory.join("extension.json"), &extension_bytes)?;
        let details = json!({"extensionSha256":hex::encode(Sha256::digest(&extension_bytes)),"assetSha256":asset_hashes});
        write_private(
            &version_directory.join("extension-pack.json"),
            &serde_json::to_vec_pretty(&details)
                .map_err(|_| "Could not encode pet extension details.".to_string())?,
        )?;
        super::extension_catalog::candidate(&base_id, &extension_version)
    })();
    match result {
        Ok(extension) => Ok(PetExtensionCandidateView {
            candidate_id: extension_version,
            extension,
        }),
        Err(error) => {
            let _ = fs::remove_dir_all(version_directory);
            Err(error)
        }
    }
}
