pub use pet_town_agent_broker::{AgentSnapshot, AgentView};

pub(crate) fn safe_display_label(value: Option<&str>) -> Option<String> {
    let cleaned: String = value?
        .chars()
        .filter(|character| !character.is_control())
        .take(48)
        .collect();
    let trimmed = cleaned.trim();
    (!trimmed.is_empty()).then(|| trimmed.to_string())
}
