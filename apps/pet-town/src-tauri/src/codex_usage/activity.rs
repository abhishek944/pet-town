use super::Snapshot;
use pet_town_agent_broker::{AgentView, TokenActivity, TokenMeasurement};
use std::collections::{HashMap, VecDeque};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

const WINDOW: Duration = Duration::from_secs(5);
const MAX_GAP: Duration = Duration::from_secs(6);

struct Meter {
    output: u64,
    epoch: u64,
    observed: Instant,
    increments: VecDeque<(Instant, u64)>,
}

static METERS: OnceLock<Mutex<HashMap<String, Meter>>> = OnceLock::new();

/// Sample reported counters, not transcript text. First readings and replay are
/// baselines, never activity. Keep this off the UI thread with usage refresh.
pub(crate) fn attach_activity(agents: &mut [AgentView], usage: &Snapshot) {
    let now = Instant::now();
    let now_ms = crate::adapter_events::current_time_ms();
    let mut meters = METERS
        .get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .unwrap_or_else(|error| error.into_inner());
    meters.retain(|id, _| {
        agents
            .iter()
            .any(|agent| &agent.id == id && agent.status == "working")
    });
    for agent in agents {
        let Some(reading) = usage.by_agent.get(&agent.id).filter(|reading| {
            usage.available
                && reading.status == "measured"
                && agent.status == "working"
                && reading.updated_at_seconds.is_some_and(|updated| {
                    updated.saturating_mul(1000) <= now_ms.saturating_add(1000)
                        && now_ms.saturating_sub(updated.saturating_mul(1000)) <= 6000
                })
        }) else {
            meters.remove(&agent.id);
            continue;
        };
        let output = reading.tokens.output_tokens;
        let Some(meter) = meters.get_mut(&agent.id) else {
            meters.insert(
                agent.id.clone(),
                Meter {
                    output,
                    epoch: reading.counter_epoch,
                    observed: now,
                    increments: VecDeque::new(),
                },
            );
            continue;
        };
        if meter.epoch != reading.counter_epoch
            || output < meter.output
            || now.duration_since(meter.observed) > MAX_GAP
        {
            meter.output = output;
            meter.epoch = reading.counter_epoch;
            meter.observed = now;
            meter.increments.clear();
            continue;
        }
        let increment = output - meter.output;
        meter.output = output;
        meter.observed = now;
        if increment > 0 {
            meter.increments.push_back((now, increment));
        }
        while meter
            .increments
            .front()
            .is_some_and(|(at, _)| now.duration_since(*at) >= WINDOW)
        {
            meter.increments.pop_front();
        }
        let output_tokens_per_minute = meter
            .increments
            .iter()
            .fold(0_u64, |sum, (_, count)| sum.saturating_add(*count))
            .saturating_mul(12)
            .min(1_000_000) as u32;
        if agent.token_activity.is_none() {
            agent.token_activity = Some(TokenActivity {
                output_tokens_per_minute,
                observed_at_ms: now_ms,
                measurement: TokenMeasurement::Reported,
            });
        }
    }
}
