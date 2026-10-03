use super::model::{Session, Tokens};

// Codex published standard credits per million tokens, verified 2026-10-02.
// These are standard-rate equivalents; fast/priority, plan, and billing differ.
fn rates(model: &str) -> Option<(f64, f64, f64)> {
    match model.to_ascii_lowercase().as_str() {
        "gpt-6.1-sol" => Some((50.0, 2.5, 250.0)),
        "gpt-6-sol" => Some((50.0, 5.0, 250.0)),
        "gpt-6-astra" => Some((250.0, 25.0, 1250.0)),
        "gpt-6-luna" => Some((2.5, 0.25, 12.5)),
        "gpt-5.6-sol" => Some((100.0, 10.0, 500.0)),
        "gpt-5.6-terra" => Some((50.0, 5.0, 300.0)),
        "gpt-5.6-luna" => Some((5.0, 0.5, 30.0)),
        "gpt-5.5" => Some((125.0, 12.5, 750.0)),
        _ => None,
    }
}

pub(super) fn estimate(session: &Session) -> Option<f64> {
    if session.estimate_incomplete || session.tokens.is_none() || session.models.is_empty() {
        return None;
    }
    session
        .models
        .iter()
        .try_fold(0.0, |total, (model, tokens)| {
            let (input, cached, output) = rates(model)?;
            Some(
                total
                    + (tokens
                        .input_tokens
                        .saturating_sub(tokens.cached_input_tokens) as f64
                        * input
                        + tokens.cached_input_tokens as f64 * cached
                        + tokens.output_tokens as f64 * output)
                        / 1_000_000.0,
            )
        })
}

pub(super) fn record_delta(session: &mut Session, next: &Tokens) {
    let previous = session.tokens.clone().unwrap_or_default();
    if next.input_tokens < previous.input_tokens
        || next.cached_input_tokens < previous.cached_input_tokens
        || next.output_tokens < previous.output_tokens
        || next.reasoning_output_tokens < previous.reasoning_output_tokens
        || next.total_tokens < previous.total_tokens
    {
        session.estimate_incomplete = true;
    }
    let delta = Tokens {
        input_tokens: next.input_tokens.saturating_sub(previous.input_tokens),
        cached_input_tokens: next
            .cached_input_tokens
            .saturating_sub(previous.cached_input_tokens),
        output_tokens: next.output_tokens.saturating_sub(previous.output_tokens),
        reasoning_output_tokens: next
            .reasoning_output_tokens
            .saturating_sub(previous.reasoning_output_tokens),
        total_tokens: next.total_tokens.saturating_sub(previous.total_tokens),
    };
    if let Some(model) = session
        .model
        .as_ref()
        .filter(|_| session.models.len() < 128)
    {
        session.models.entry(model.clone()).or_default().add(&delta);
    } else if delta.total_tokens > 0 {
        session.estimate_incomplete = true;
    }
}
