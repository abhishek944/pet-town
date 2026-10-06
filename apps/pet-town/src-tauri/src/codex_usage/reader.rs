use super::{
    model::{Session, Tokens},
    pricing, registration, storage,
};
use serde_json::Value;
use std::io::{Read, Seek, SeekFrom};

const CHUNK: usize = 256 * 1024;
const HEADER_LIMIT: usize = registration::HEADER_LIMIT;
pub(super) const MIN_BUDGET: usize = HEADER_LIMIT + CHUNK;

fn parse_tokens(value: &Value) -> Option<Tokens> {
    let next = Tokens {
        input_tokens: value["input_tokens"].as_u64()?,
        cached_input_tokens: value["cached_input_tokens"].as_u64()?,
        output_tokens: value["output_tokens"].as_u64()?,
        reasoning_output_tokens: value["reasoning_output_tokens"].as_u64()?,
        total_tokens: value["total_tokens"].as_u64()?,
    };
    (next.cached_input_tokens <= next.input_tokens
        && next.reasoning_output_tokens <= next.output_tokens)
        .then_some(next)
}

fn consume(session: &mut Session, bytes: &[u8]) {
    let Ok(record) = serde_json::from_slice::<Value>(bytes) else {
        session.model = None;
        session.measurement_incomplete = true;
        return;
    };
    let payload = &record["payload"];
    if record["type"] == "turn_context" {
        // A missing or unknown model must never inherit a prior turn's price.
        session.model = payload["model"].as_str().and_then(registration::safe_model);
    } else if record["type"] == "event_msg" && payload["type"] == "model_reroute" {
        session.model = payload["to_model"]
            .as_str()
            .and_then(registration::safe_model);
    } else if record["type"] == "event_msg" && payload["type"] == "token_count" {
        let value = &payload["info"]["total_token_usage"];
        if value.is_null() {
            return;
        }
        if let Some(tokens) = parse_tokens(value) {
            if session
                .tokens
                .as_ref()
                .is_some_and(|old| tokens.regressed_from(old))
            {
                session.counter_epoch = session.counter_epoch.saturating_add(1);
            }
            pricing::record_delta(session, &tokens);
            session.tokens = Some(tokens);
            session.measurement_incomplete = false;
            session.updated_at_seconds = crate::adapter_events::current_time_seconds();
        } else {
            session.measurement_incomplete = true;
        }
    }
}

fn open_transcript(session: &mut Session) -> Option<std::fs::File> {
    let root = session
        .transcript_root
        .clone()
        .or_else(registration::configured_root)?;
    let path = registration::validated_path_in(&session.path, &root).or_else(|| {
        // Codex may move this specific known session into its archive directory.
        let archived = root
            .join("archived_sessions")
            .join(session.path.file_name()?);
        registration::validated_path_in(&archived, &root)
    })?;
    let mut file = storage::private_open(&path)?;
    session.inherited_history |= registration::header(&mut file, &session.session_id)?;
    session.path = path;
    Some(file)
}

pub(super) fn advance(session: &mut Session, budget: &mut usize) {
    *budget = budget.saturating_sub(HEADER_LIMIT);
    let Some(mut file) = open_transcript(session) else {
        session.partial = true;
        return;
    };
    if session.inherited_history {
        session.partial = true;
        return;
    }
    let identity = storage::identity(&file);
    let length = file.metadata().map(|meta| meta.len()).unwrap_or(0);
    if session.file_identity != identity || length < session.offset.max(session.scan_offset) {
        session.offset = 0;
        session.scan_offset = 0;
        session.tokens = None;
        session.counter_epoch = session.counter_epoch.saturating_add(1);
        session.model = None;
        session.models.clear();
        session.estimate_incomplete = false;
        session.measurement_incomplete = false;
    }
    session.file_identity = identity;
    session.partial = false;
    let start = session.scan_offset.max(session.offset);
    let limit = CHUNK.min(*budget);
    if file.seek(SeekFrom::Start(start)).is_err() {
        session.partial = true;
        return;
    }
    let mut bytes = Vec::new();
    if file.take(limit as u64).read_to_end(&mut bytes).is_err() {
        session.partial = true;
        return;
    }
    *budget = budget.saturating_sub(bytes.len());
    let mut beginning = 0;
    let mut discarding = session.scan_offset > session.offset;
    for (index, byte) in bytes.iter().enumerate() {
        if *byte != b'\n' {
            continue;
        }
        if !discarding {
            consume(session, &bytes[beginning..index]);
        }
        discarding = false;
        beginning = index + 1;
        session.offset = start + beginning as u64;
        session.scan_offset = 0;
    }
    // Huge message lines are skipped without storing prompts or blocking replay.
    if beginning == 0 && bytes.len() == limit && limit > 0 {
        // An oversized context may contain a model switch. Fail closed on price.
        session.model = None;
        session.measurement_incomplete = true;
        session.scan_offset = start + bytes.len() as u64;
    } else if discarding {
        session.scan_offset = start + bytes.len() as u64;
    }
    session.partial |= session.offset < length;
}
