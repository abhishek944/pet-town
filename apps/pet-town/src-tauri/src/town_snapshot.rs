use crate::{
    orchestrator::{firstmate, OrchestratorState},
    preferences::PreferencesStore,
    preferences_model::MayorMode,
};
use serde_json::{json, Value};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager, WebviewWindow};

const ROSTER_REFRESH: Duration = Duration::from_millis(500);
const ROSTER_MAX_AGE: Duration = Duration::from_secs(10);

#[derive(Default)]
pub(crate) struct TownRosterCache {
    collecting: bool,
    started_at: Option<Instant>,
    observed_at: Option<Instant>,
    available: bool,
    agents: Vec<crate::AgentView>,
    usage: crate::codex_usage::Snapshot,
}

#[tauri::command]
pub(crate) async fn get_town_snapshot(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<Value, String> {
    crate::town_commands::require_town(&window)?;
    Ok(snapshot(&app))
}

pub(crate) fn snapshot(app: &AppHandle) -> Value {
    let (agents, usage) = cached_roster(app);
    let mode = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator
        .mode;
    json!({
        "v": 1, "type": "snapshot", "available": agents.available,
        "agents": agents.agents, "mayor": mayor_snapshot(app, &mode), "mode": mode,
        "usage": usage,
    })
}

fn cached_roster(app: &AppHandle) -> (crate::AgentSnapshot, crate::codex_usage::Snapshot) {
    let state = app.state::<crate::town_process::TownWindowState>();
    let mut cache = state
        .roster
        .lock()
        .unwrap_or_else(|error| error.into_inner());
    let now = Instant::now();
    if !cache.collecting
        && cache
            .started_at
            .is_none_or(|time| now.duration_since(time) >= ROSTER_REFRESH)
    {
        cache.collecting = true;
        cache.started_at = Some(now);
        refresh_roster(app.clone());
    }
    let fresh = cache
        .observed_at
        .is_some_and(|time| now.duration_since(time) <= ROSTER_MAX_AGE);
    let available = fresh && cache.available;
    let mut usage = cache.usage.clone();
    usage.available &= fresh;
    (
        crate::AgentSnapshot {
            available,
            agents: if available {
                cache.agents.clone()
            } else {
                Vec::new()
            },
        },
        usage,
    )
}

fn refresh_roster(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let result = tauri::async_runtime::spawn_blocking(|| {
            let collected = crate::sessions::collect_visible();
            let usage = crate::codex_usage::refresh();
            (collected, usage)
        })
        .await;
        let state = app.state::<crate::town_process::TownWindowState>();
        let mut cache = state
            .roster
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        cache.collecting = false;
        cache.observed_at = Some(Instant::now());
        match result {
            Ok((collected, usage)) => {
                cache.usage = usage;
                cache.available = collected.snapshot.available;
                cache.agents = collected
                    .snapshot
                    .agents
                    .into_iter()
                    .filter(|agent| matches!(agent.status.as_str(), "working" | "blocked" | "done"))
                    .collect();
            }
            Err(_) => {
                cache.available = false;
                cache.agents.clear();
            }
        }
    });
}

fn mayor_snapshot(app: &AppHandle, mode: &MayorMode) -> Value {
    let (town_talk_requested, town_talk_applied, town_talk_generation) =
        crate::town_voice::talk_snapshot(app);
    let state = app.state::<OrchestratorState>();
    let pet = state.pet_state(app);
    let runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    let firstmate_mode = *mode == MayorMode::Firstmate;
    let conversation_active = if firstmate_mode {
        firstmate::phase(app) != firstmate::READY
    } else {
        runtime.listening
            || runtime.mayor_speaking
            || runtime.live_connected
            || runtime.connecting
            || runtime.wake_activated
    };
    json!({
        "active": pet.active, "name": pet.display_name,
        "listening": pet.listening, "working": pet.working, "speaking": pet.speaking,
        "focusSerial": runtime.mayor_focus_serial, "conversationActive": conversation_active,
        "speech": runtime.mayor_speech, "voiceStatus": runtime.mayor_voice_status,
        "liveConnected": runtime.live_connected, "connecting": runtime.connecting,
        "wakeActivated": runtime.wake_activated, "wakeStatus": runtime.wake_status,
        "degradedNote": runtime.degraded_note,
        "firstmateMode": firstmate_mode, "firstmateOwned": firstmate::firstmate_voice_ready(app.clone()),
        "townTalkRequested": town_talk_requested, "townTalkApplied": town_talk_applied,
        "townTalkGeneration": town_talk_generation,
    })
}
