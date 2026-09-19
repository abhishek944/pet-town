use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub const SCHEMA_VERSION: u32 = 3;
pub const ASSISTANT_PET_ID: &str = "mossback-turtle-monk";
pub const COMPLETED_HIDE_DELAYS_MINUTES: [u16; 5] = [1, 5, 15, 30, 60];

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PreferencesFile {
    pub schema_version: u32,
    pub app: AppPreferences,
    pub pets: BTreeMap<String, PetPreferences>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AppPreferences {
    pub open_with_herdr: bool,
    pub settings_appearance: SettingsAppearance,
    pub last_selected_pet_id: String,
    pub hide_completed_pets: bool,
    pub completed_hide_delay_minutes: u16,
    pub orchestrator: OrchestratorPreferences,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OrchestratorPreferences {
    pub enabled: bool,
    pub display_name: String,
    pub model: String,
    pub thinking: String,
    pub wake_enabled: bool,
    pub pet_id: Option<String>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PetPreferences {
    pub included_in_random_cast: bool,
    pub appearance: AppearancePreferences,
    pub labels: LabelPreferences,
    pub motion: MotionPreferences,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AppearancePreferences {
    pub scale_percent: u16,
    pub opacity_percent: u16,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LabelPreferences {
    pub visibility: LabelVisibility,
    pub text_scale_percent: u16,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct MotionPreferences {
    pub level: MotionLevel,
    pub reduced: bool,
    pub pause_on_hover: bool,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SettingsAppearance {
    System,
    Light,
    Dark,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum LabelVisibility {
    Always,
    Hover,
    Hidden,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum MotionLevel {
    Gentle,
    Standard,
    Playful,
}

pub fn bundled_pet_ids() -> Vec<String> {
    env!("PET_TOWN_PET_IDS")
        .split(',')
        .filter(|id| !id.is_empty())
        .map(str::to_string)
        .collect()
}

impl PreferencesFile {
    pub fn defaults(ids: &[String]) -> Self {
        let first = ids
            .iter()
            .find(|id| id.as_str() == "cat")
            .or_else(|| ids.first())
            .cloned()
            .unwrap_or_else(|| "cat".to_string());
        Self {
            schema_version: SCHEMA_VERSION,
            app: AppPreferences {
                open_with_herdr: true,
                settings_appearance: SettingsAppearance::System,
                last_selected_pet_id: first,
                hide_completed_pets: false,
                completed_hide_delay_minutes: 5,
                orchestrator: OrchestratorPreferences {
                    enabled: false,
                    display_name: "Mochi".to_string(),
                    model: "gpt-5.6-luna".to_string(),
                    thinking: "medium".to_string(),
                    wake_enabled: true,
                    pet_id: Some(ASSISTANT_PET_ID.to_string()),
                },
            },
            pets: ids
                .iter()
                .map(|id| (id.clone(), PetPreferences::default()))
                .collect(),
        }
    }

    pub fn normalize_assistant(&mut self) {
        self.app.orchestrator.wake_enabled = true;
        self.app.orchestrator.pet_id = Some(ASSISTANT_PET_ID.to_string());
    }

    pub fn validate(&self, ids: &[String]) -> Result<(), String> {
        if self.schema_version != SCHEMA_VERSION {
            return Err("unsupported preference schema version".to_string());
        }
        if !self.pets.contains_key(&self.app.last_selected_pet_id) {
            return Err("lastSelectedPetId is not an installed pet".to_string());
        }
        if !COMPLETED_HIDE_DELAYS_MINUTES.contains(&self.app.completed_hide_delay_minutes) {
            return Err("completedHideDelayMinutes is not a supported delay".to_string());
        }
        let orchestrator = &self.app.orchestrator;
        let name = orchestrator.display_name.trim();
        if name.is_empty() || name.chars().count() > 32 || name.chars().any(char::is_control) {
            return Err("orchestrator.displayName must contain 1–32 safe characters".to_string());
        }
        if !["gpt-5.6-luna", "gpt-5.6-sol", "gpt-5.6-terra"].contains(&orchestrator.model.as_str())
            || !["low", "medium", "high", "xhigh"].contains(&orchestrator.thinking.as_str())
        {
            return Err("orchestrator model or thinking level is unsupported".to_string());
        }
        if !orchestrator.wake_enabled {
            return Err("orchestrator.wakeEnabled must remain on".to_string());
        }
        if orchestrator.pet_id.as_deref() != Some(ASSISTANT_PET_ID)
            || !ids.iter().any(|id| id == ASSISTANT_PET_ID)
        {
            return Err("orchestrator.petId must use the bundled Mossback tortoise".to_string());
        }
        let actual: Vec<&str> = self.pets.keys().map(String::as_str).collect();
        let expected: Vec<&str> = ids.iter().map(String::as_str).collect();
        if actual != expected {
            return Err("pets must contain every installed pet ID exactly once".to_string());
        }
        if !self.pets.values().any(|pet| pet.included_in_random_cast) {
            return Err("at least one pet must be included in the random cast".to_string());
        }
        for (id, pet) in &self.pets {
            if !(75..=175).contains(&pet.appearance.scale_percent) {
                return Err(format!("{id}.appearance.scalePercent must be 75–175"));
            }
            if !(30..=100).contains(&pet.appearance.opacity_percent) {
                return Err(format!("{id}.appearance.opacityPercent must be 30–100"));
            }
            if !(75..=160).contains(&pet.labels.text_scale_percent) {
                return Err(format!("{id}.labels.textScalePercent must be 75–160"));
            }
        }
        Ok(())
    }
}
