use super::types::{Draft, SavePackRequest, StateSelection};
use serde_json::{json, Value};
use std::collections::HashSet;

const STATES: [&str; 6] = ["idle", "working", "blocked", "done", "unknown", "listening"];

fn state_value(selection: &StateSelection, animation: Option<&str>) -> Result<Value, String> {
    if !matches!(selection.action.as_str(), "idle" | "walking") {
        return Err("State action must be Idle or Walking.".into());
    }
    if selection.visible && animation.is_none() {
        return Err("A visible state needs an APNG.".into());
    }
    Ok(json!({"animation":animation,"action":selection.action,"visible":selection.visible}))
}

pub fn build(id: &str, request: &SavePackRequest, draft: &Draft) -> Result<Value, String> {
    if request.state_assignments.len() != STATES.len()
        || request
            .state_assignments
            .keys()
            .any(|state| !STATES.contains(&state.as_str()))
    {
        return Err("Assign all six pet states.".into());
    }
    let mut names = HashSet::new();
    let mut states = serde_json::Map::new();
    for state in STATES {
        let selection = &request.state_assignments[state];
        let animation = if selection.visible {
            let source = selection
                .animation
                .as_deref()
                .ok_or("A visible state needs an APNG.")?;
            let name = source
                .strip_prefix("imported:")
                .ok_or("Choose an imported APNG for a new pet.")?;
            if !draft.animations.contains_key(name) {
                return Err(format!("Animation {name} has not been imported."));
            }
            names.insert(name.to_string());
            Some(name)
        } else {
            None
        };
        states.insert(state.to_string(), state_value(selection, animation)?);
    }
    if names.is_empty() {
        return Err("A pet needs at least one visible APNG.".into());
    }
    let orchestrator = if request.assign_to_orchestrator {
        let animation = |state: &str| -> Result<String, String> {
            let selection = &request.state_assignments[state];
            if !selection.visible {
                return Err(format!(
                    "Choose an APNG for {state} to use this pet as Mayor."
                ));
            }
            selection
                .animation
                .as_deref()
                .and_then(|value| value.strip_prefix("imported:"))
                .map(str::to_owned)
                .ok_or_else(|| format!("Choose an imported APNG for {state}."))
        };
        Some(json!({"walking":animation("working")?,"listening":animation("listening")?}))
    } else {
        None
    };
    let mut clips = serde_json::Map::new();
    for name in names {
        let item = &draft.animations[&name];
        clips.insert(
            name.clone(),
            json!({"asset":format!("assets/{name}.png"),
            "durationMs":item.duration_ms,"role":item.role,"sourceFacing":"right","mirror":true}),
        );
    }
    Ok(
        json!({"formatVersion":1,"id":id,"packVersion":uuid::Uuid::new_v4().to_string(),
        "clips":clips,"states":states,"orchestratorAnimations":orchestrator}),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pet_studio::types::AnimationDraft;
    use std::collections::HashMap;
    use std::path::PathBuf;

    #[test]
    fn one_apng_can_cover_all_visible_states() {
        let draft = Draft {
            id: "draft".into(),
            directory: PathBuf::new(),
            animations: HashMap::from([(
                "pet".into(),
                AnimationDraft {
                    apng: PathBuf::new(),
                    duration_ms: 800,
                    role: "stationary".into(),
                },
            )]),
            extension_candidates: vec![],
        };
        let state_assignments = STATES
            .iter()
            .map(|state| {
                let visible = !matches!(*state, "idle" | "unknown");
                (
                    (*state).to_string(),
                    StateSelection {
                        animation: visible.then(|| "imported:pet".into()),
                        action: if *state == "working" {
                            "walking"
                        } else {
                            "idle"
                        }
                        .into(),
                        visible,
                    },
                )
            })
            .collect();
        let mut request = SavePackRequest {
            draft_id: "draft".into(),
            display_name: "Pet".into(),
            state_assignments,
            assign_to_orchestrator: false,
        };
        let manifest = build("user-pet", &request, &draft).unwrap();
        assert_eq!(manifest["clips"].as_object().unwrap().len(), 1);
        assert_eq!(manifest["states"]["working"]["action"], "walking");
        assert_eq!(manifest["states"]["blocked"]["animation"], "pet");
        assert_eq!(manifest["states"]["idle"]["visible"], false);
        request.assign_to_orchestrator = true;
        let mayor_manifest = build("mayor-pet", &request, &draft).unwrap();
        assert_eq!(mayor_manifest["orchestratorAnimations"]["walking"], "pet");
        assert_eq!(mayor_manifest["orchestratorAnimations"]["listening"], "pet");
        assert_eq!(mayor_manifest["states"]["listening"]["animation"], "pet");
    }
}
