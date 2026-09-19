use base64::Engine;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Emitter;

const MAX_BYTES: usize = 20 * 1024 * 1024;
const CAPABILITIES: [&str; 8] = [
    "walk", "throw", "catch", "wave", "sleep", "react", "follow", "dance",
];

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct StoredMapping {
    pet_id: String,
    capability: String,
    frames: u32,
    frame_width: u32,
    frame_height: u32,
    frame_duration: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CapabilityMapping {
    pet_id: String,
    capability: String,
    frames: u32,
    frame_width: u32,
    frame_height: u32,
    frame_duration: u32,
    data_url: String,
}

fn safe_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
}

fn root() -> Result<PathBuf, String> {
    let home = std::env::var_os("HOME").ok_or("HOME is not available")?;
    Ok(PathBuf::from(home).join(".pet-town-v2").join("pets"))
}

fn dimensions(bytes: &[u8]) -> Result<(u32, u32), String> {
    if bytes.len() < 24 || &bytes[..8] != b"\x89PNG\r\n\x1a\n" {
        return Err("Capability asset must be a PNG sprite sheet".to_string());
    }
    let width = u32::from_be_bytes(bytes[16..20].try_into().map_err(|_| "Invalid PNG width")?);
    let height = u32::from_be_bytes(bytes[20..24].try_into().map_err(|_| "Invalid PNG height")?);
    if width == 0 || height == 0 || width > 8192 || height > 4096 {
        return Err("Sprite sheet dimensions are unsupported".to_string());
    }
    Ok((width, height))
}

#[tauri::command]
pub(crate) fn save_capability_mapping(
    app: tauri::AppHandle,
    pet_id: String,
    capability: String,
    bytes: Vec<u8>,
    frames: u32,
) -> Result<CapabilityMapping, String> {
    if !safe_id(&pet_id) || !CAPABILITIES.contains(&capability.as_str()) {
        return Err("Pet or capability ID is unsupported".to_string());
    }
    if bytes.is_empty() || bytes.len() > MAX_BYTES || !(2..=16).contains(&frames) {
        return Err("Sprite sheet must contain 2–16 frames and be under 20 MB".to_string());
    }
    let (width, height) = dimensions(&bytes)?;
    if width % frames != 0 {
        return Err("Sprite sheet width must divide evenly into its frame count".to_string());
    }
    let mapping = StoredMapping {
        pet_id: pet_id.clone(),
        capability: capability.clone(),
        frames,
        frame_width: width / frames,
        frame_height: height,
        frame_duration: 120,
    };
    let directory = root()?.join(&pet_id);
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    let png = directory.join(format!("{capability}.png"));
    let metadata = directory.join(format!("{capability}.json"));
    let temporary_png = png.with_extension("png.tmp");
    let temporary_metadata = metadata.with_extension("json.tmp");
    fs::write(&temporary_png, &bytes).map_err(|error| error.to_string())?;
    fs::write(
        &temporary_metadata,
        serde_json::to_vec_pretty(&mapping).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())?;
    fs::rename(temporary_png, png).map_err(|error| error.to_string())?;
    fs::rename(temporary_metadata, metadata).map_err(|error| error.to_string())?;
    let result = mapping_with_data(mapping, bytes);
    let _ = app.emit("capability-mappings-changed", ());
    Ok(result)
}

#[tauri::command]
pub(crate) fn list_capability_mappings() -> Result<Vec<CapabilityMapping>, String> {
    let mut mappings = Vec::new();
    let Ok(pets) = fs::read_dir(root()?) else {
        return Ok(mappings);
    };
    for pet in pets.flatten().filter(|entry| entry.path().is_dir()) {
        let Ok(files) = fs::read_dir(pet.path()) else {
            continue;
        };
        for metadata in files.flatten().filter(|entry| {
            entry.path().extension().and_then(|value| value.to_str()) == Some("json")
        }) {
            let Some(stored) = fs::read(metadata.path())
                .ok()
                .and_then(|bytes| serde_json::from_slice::<StoredMapping>(&bytes).ok())
            else {
                continue;
            };
            let png = metadata.path().with_extension("png");
            let Ok(bytes) = fs::read(png) else {
                continue;
            };
            if dimensions(&bytes).is_ok() {
                mappings.push(mapping_with_data(stored, bytes));
            }
        }
    }
    Ok(mappings)
}

fn mapping_with_data(mapping: StoredMapping, bytes: Vec<u8>) -> CapabilityMapping {
    CapabilityMapping {
        pet_id: mapping.pet_id,
        capability: mapping.capability,
        frames: mapping.frames,
        frame_width: mapping.frame_width,
        frame_height: mapping.frame_height,
        frame_duration: mapping.frame_duration,
        data_url: format!(
            "data:image/png;base64,{}",
            base64::engine::general_purpose::STANDARD.encode(bytes)
        ),
    }
}
