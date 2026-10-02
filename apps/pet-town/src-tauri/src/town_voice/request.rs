use super::{release_talk, set_talk};
use crate::town_process::TownWindowState;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};

#[derive(Default)]
pub(crate) struct TownTalkState {
    pub(super) requested: bool,
    pub(super) generation: u64,
    pub(super) applied_generation: u64,
    pub(super) observed_listening: bool,
    pub(super) failure: Option<(u64, String)>,
}

/// A release only resolves after the existing control loop consumes it. This
/// keeps a quick retry from replacing the release signal before it is applied.
pub(crate) async fn request_talk(app: AppHandle, active: bool) -> Result<(), String> {
    let generation = set_talk(&app, active)?;
    tauri::async_runtime::spawn_blocking(move || {
        let deadline = Instant::now() + Duration::from_secs(2);
        loop {
            {
                let state = app.state::<TownWindowState>();
                let held = state
                    .talking
                    .lock()
                    .unwrap_or_else(|error| error.into_inner());
                if let Some((failed, error)) = &held.failure {
                    if *failed == generation {
                        return Err(error.clone());
                    }
                }
                if held.applied_generation >= generation {
                    return Ok(());
                }
                // Releasing before startup finishes cancels that start request.
                if active && held.generation != generation {
                    return Ok(());
                }
            }
            if Instant::now() >= deadline {
                if active {
                    release_talk(&app);
                }
                return Err("Mayor microphone control did not respond. Try again.".into());
            }
            std::thread::sleep(Duration::from_millis(10));
        }
    })
    .await
    .map_err(|_| "Mayor microphone control was interrupted.".to_string())?
}
