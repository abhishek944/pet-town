use super::store::{create_private_dir, flow_id, pack_id, root, secure_dir, write_private};
use super::types::{
    Draft, PetExtensionCandidateView, SaveExtensionRequest, StateSelection, StoredPetExtension,
};
use base64::Engine;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, HashMap};
use std::fs;

fn state_value(selection: &StateSelection, animation: Option<String>) -> Result<Value, String> {
    if !matches!(selection.action.as_str(), "idle" | "walking") {
        return Err("State action must be Idle or Walking.".into());
    }
    if selection.visible && animation.is_none() {
        return Err("A visible state needs an APNG.".into());
    }
    Ok(json!({"animation":animation,"action":selection.action,"visible":selection.visible}))
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
    let actions = serde_json::Map::new();
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
        let internal = internal_name(draft, name);
        let bytes =
            fs::read(&animation.apng).map_err(|_| "Could not stage an animation.".to_string())?;
        clips.insert(internal.clone(), json!({"asset":format!("assets/{internal}.png"),
            "durationMs":animation.duration_ms,"role":animation.role,"sourceFacing":"right","mirror":true}));
        assets.insert(format!("assets/{internal}.png"), bytes);
        names.insert(name.clone(), internal);
    }
    for (state, selection) in &request.state_assignments {
        if !matches!(
            state.as_str(),
            "idle" | "working" | "blocked" | "done" | "unknown" | "listening" | "speaking"
        ) {
            return Err("Choose a valid pet state to replace.".into());
        }
        let animation = if selection.visible {
            let value = selection
                .animation
                .as_deref()
                .ok_or("A visible state needs an APNG.")?;
            if let Some(imported) = value.strip_prefix("imported:") {
                Some(
                    names
                        .get(imported)
                        .ok_or("The imported APNG is unavailable.")?
                        .clone(),
                )
            } else if let Some(existing) = value.strip_prefix("existing:") {
                Some(flow_id(existing, "Animation")?)
            } else {
                return Err("Choose an imported or existing APNG.".into());
            }
        } else {
            None
        };
        states.insert(state.clone(), state_value(selection, animation)?);
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
