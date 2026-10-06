use super::AdapterEventRecord;
use pet_town_agent_broker::{TokenActivity, TokenMeasurement};
use serde_json::Value;
use std::fs::OpenOptions;
use std::io::Read;
#[cfg(unix)]
use std::os::unix::fs::OpenOptionsExt;
use std::path::Path;

pub(super) fn previous(path: &Path) -> Option<AdapterEventRecord> {
    let mut options = OpenOptions::new();
    options.read(true);
    #[cfg(unix)]
    options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    let file = options.open(path).ok()?;
    if !file.metadata().ok()?.is_file() {
        return None;
    }
    let mut bytes = Vec::new();
    file.take(super::EVENT_INPUT_LIMIT + 1)
        .read_to_end(&mut bytes)
        .ok()?;
    if bytes.len() as u64 > super::EVENT_INPUT_LIMIT {
        return None;
    }
    serde_json::from_slice(&bytes).ok()
}

/// Numeric telemetry is not a lifecycle event: never create or wake an agent.
pub(super) fn publish(path: &Path, payload: &Value) -> Result<(), String> {
    let Some(mut record) = previous(path) else {
        return Ok(());
    };
    if record.source != "pi" || record.state != "working" {
        return Ok(());
    }
    let Some(rate) = payload["output_tokens_per_minute"]
        .as_u64()
        .filter(|rate| *rate <= 1_000_000)
    else {
        return Ok(());
    };
    let Some(observed_at_ms) = payload["observed_at_ms"].as_u64() else {
        return Ok(());
    };
    let sample = TokenActivity {
        output_tokens_per_minute: rate as u32,
        observed_at_ms,
        measurement: TokenMeasurement::Estimated,
    };
    if !sample.is_fresh(super::current_time_ms())
        || sample.observed_at_ms < record.state_observed_at_ms
        || record
            .token_activity
            .as_ref()
            .is_some_and(|old| sample.observed_at_ms <= old.observed_at_ms)
    {
        return Ok(());
    }
    record.token_activity = Some(sample);
    // Keep lifecycle time/expiry and ownership unchanged.
    let bytes =
        serde_json::to_vec(&record).map_err(|_| "could not encode token activity".to_string())?;
    super::write_private_atomic(path, &bytes)
}
