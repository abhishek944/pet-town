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
}

#[tauri::command]
pub(crate) async fn get_town_snapshot(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<Value, String> {
    crate::town_commands::require_town(&window)?;
    let agents = cached_roster(&app);
    let mode = app
        .state::<PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator
        .mode;
    Ok(json!({
        "v": 1, "type": "snapshot", "available": agents.available,
        "agents": agents.agents, "mayor": mayor_snapshot(&app, &mode), "mode": mode,
    }))
}

fn cached_roster(app: &AppHandle) -> crate::AgentSnapshot {
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
        refresh_roster(app.clone(), now);
    }
    let fresh = cache
        .observed_at
        .is_some_and(|time| now.duration_since(time) <= ROSTER_MAX_AGE);
    let available = fresh && cache.available;
    crate::AgentSnapshot {
        available,
        agents: if available {
            cache.agents.clone()
        } else {
            Vec::new()
        },
    }
}

fn refresh_roster(app: AppHandle, started_at: Instant) {
    tauri::async_runtime::spawn(async move {
        let result = tauri::async_runtime::spawn_blocking(crate::sessions::collect_visible).await;
        let state = app.state::<crate::town_process::TownWindowState>();
        let mut cache = state
            .roster
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        cache.collecting = false;
        cache.observed_at = Some(started_at);
        match result {
            Ok(collected) => {
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
