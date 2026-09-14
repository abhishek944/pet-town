use super::store::flow_id;
use super::types::{Draft, SavePackRequest};
use serde_json::{json, Value};

fn clip(animation: &str, role: &str, duration: u32) -> Value {
    json!({"asset":format!("assets/{animation}.png"),"durationMs":duration,"role":role,"sourceFacing":"right","mirror":true})
}

pub fn build(id: &str, request: &SavePackRequest, draft: &Draft) -> Result<Value, String> {
    let mut selected = vec![
        &request.walk,
        &request.work,
        &request.blocked,
        &request.celebrate,
        &request.sleep,
        &request.unknown,
    ];
    if request.assign_to_orchestrator {
        if request.orchestrator_walk.is_empty() || request.orchestrator_listening.is_empty() {
            return Err("Walking and Listening orchestrator animations are required.".into());
        }
        if request.orchestrator_walk == request.orchestrator_listening {
            return Err("Walking and Listening must use different animations.".into());
        }
        selected.extend([&request.orchestrator_walk, &request.orchestrator_listening]);
    }
    let mut clips = serde_json::Map::new();
    for name in selected
        .into_iter()
        .chain(request.actions.iter().map(|action| &action.animation_id))
    {
        let item = draft
            .animations
            .get(name)
            .filter(|item| item.apng.is_some())
            .ok_or_else(|| format!("Animation {name} is not approved."))?;
        clips
            .entry(name.clone())
            .or_insert_with(|| clip(name, &item.role, item.duration_ms));
    }
    if draft
        .animations
        .get(&request.walk)
        .map(|item| item.role.as_str())
        != Some("locomotion")
    {
        return Err("The walking slot needs a locomotion animation.".into());
    }
    if request.assign_to_orchestrator
        && draft
            .animations
            .get(&request.orchestrator_walk)
            .map(|item| item.role.as_str())
            != Some("locomotion")
    {
        return Err("Orchestrator Walking needs a locomotion animation.".into());
    }
    let mut actions = serde_json::Map::new();
    if request.actions.len() > 8 {
        return Err("A pet can have at most eight menu actions.".into());
    }
    for action in &request.actions {
        let action_id = flow_id(&action.id, "Action")?;
        if action.label.trim().is_empty() || action.label.len() > 24 {
            return Err("Action labels must contain 1–24 characters.".into());
        }
        actions.insert(
            action_id,
            json!({"label":action.label.trim(),"flow":{"type":"play","clip":action.animation_id}}),
        );
    }
    let orchestrator = request.assign_to_orchestrator.then(
        || json!({"walking":request.orchestrator_walk,"listening":request.orchestrator_listening}),
    );
    Ok(
        json!({"formatVersion":1,"id":id,"packVersion":uuid::Uuid::new_v4().to_string(),"clips":clips,
      "orchestratorAnimations":orchestrator,"states":{
        "idle":{"completion":"restart","flow":{"type":"hide","durationMs":1000}},
        "working":{"completion":"restart","flow":{"type":"sequence","steps":[{"type":"move","clip":request.walk,"durationMs":2400,"speedPxPerSecond":30},{"type":"play","clip":request.work}]}},
        "blocked":{"completion":"restart","flow":{"type":"sequence","steps":[{"type":"play","clip":request.blocked},{"type":"wait","durationMs":300}]}},
        "done":{"completion":"restart","flow":{"type":"sequence","steps":[{"type":"play","clip":request.celebrate},{"type":"loop","flow":{"type":"play","clip":request.sleep}}]}},
        "unknown":{"completion":"restart","flow":{"type":"sequence","steps":[{"type":"play","clip":request.unknown},{"type":"wait","durationMs":600}]}}
      },"actions":actions}),
    )
}
