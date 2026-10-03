use serde::Serialize;
use std::collections::HashSet;
use std::sync::{Condvar, Mutex, MutexGuard};
use tauri::{AppHandle, Emitter, State, WebviewWindow};
use tauri_plugin_updater::Update;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Snapshot {
    pub revision: u64,
    pub phase: &'static str,
    pub current_version: String,
    pub available_version: Option<String>,
    pub notes: Option<String>,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub error: Option<String>,
}

pub(super) struct Preparation {
    pub request_id: String,
    pub expected: HashSet<String>,
    pub ready: HashSet<String>,
    pub error: Option<String>,
}

pub(super) struct RuntimeState {
    pub snapshot: Snapshot,
    pub update: Option<Update>,
    pub archive: Option<Vec<u8>>,
    pub preparation: Option<Preparation>,
    pub restart: bool,
    pub window_openers: usize,
}

pub(crate) struct AppUpdates {
    inner: Mutex<RuntimeState>,
    pub(super) prepared: Condvar,
}

impl Default for AppUpdates {
    fn default() -> Self {
        Self {
            inner: Mutex::new(RuntimeState {
                snapshot: Snapshot {
                    revision: 0,
                    phase: "idle",
                    current_version: env!("CARGO_PKG_VERSION").into(),
                    available_version: None,
                    notes: None,
                    downloaded_bytes: 0,
                    total_bytes: None,
                    error: None,
                },
                update: None,
                archive: None,
                preparation: None,
                restart: false,
                window_openers: 0,
            }),
            prepared: Condvar::new(),
        }
    }
}

impl AppUpdates {
    pub(super) fn lock(&self) -> MutexGuard<'_, RuntimeState> {
        self.inner.lock().unwrap_or_else(|error| error.into_inner())
    }

    pub(super) fn publish(&self, app: &AppHandle) {
        let snapshot = {
            let mut inner = self.lock();
            inner.snapshot.revision = inner.snapshot.revision.saturating_add(1);
            inner.snapshot.clone()
        };
        for label in ["settings", "town"] {
            let _ = app.emit_to(label, "app-update-state", &snapshot);
        }
    }

    pub(super) fn fail(&self, app: &AppHandle, phase: &'static str, error: String) -> String {
        {
            let mut inner = self.lock();
            inner.snapshot.phase = phase;
            inner.snapshot.error = Some(error.clone());
            inner.preparation = None;
        }
        self.publish(app);
        error
    }

    pub(crate) fn window_opening(&self) -> Result<WindowOpening<'_>, String> {
        let mut inner = self.lock();
        if matches!(inner.snapshot.phase, "preparing" | "installing") {
            return Err("Wait for the app update before opening another Pet Town window.".into());
        }
        inner.window_openers += 1;
        Ok(WindowOpening(self))
    }

    pub(crate) fn native_snapshot(&self) -> Snapshot {
        self.lock().snapshot.clone()
    }

    pub(crate) fn native_preparation(&self) -> Option<String> {
        self.lock()
            .preparation
            .as_ref()
            .filter(|p| {
                p.expected.contains("godot") && !p.ready.contains("godot") && p.error.is_none()
            })
            .map(|p| p.request_id.clone())
    }

    pub(crate) fn restart_requested(&self) -> bool {
        self.lock().restart
    }
}

pub(crate) struct WindowOpening<'a>(&'a AppUpdates);

impl Drop for WindowOpening<'_> {
    fn drop(&mut self) {
        self.0.lock().window_openers -= 1;
    }
}

pub(super) fn require_window(window: &WebviewWindow) -> Result<(), String> {
    if window.label() == "town" {
        return crate::town_commands::require_town(window);
    }
    let url = window.url().map_err(|error| error.to_string())?;
    let packaged = (url.scheme() == "tauri" && url.host_str() == Some("localhost"))
        || (url.scheme() == "http" && url.host_str() == Some("tauri.localhost"));
    let development = cfg!(debug_assertions)
        && url.scheme() == "http"
        && matches!(url.host_str(), Some("127.0.0.1" | "localhost"))
        && url.port() == Some(1420);
    if window.label() != "settings" || url.path() != "/settings.html" || !(packaged || development)
    {
        return Err("Updates are available only in local Pet Town Settings.".into());
    }
    Ok(())
}

pub(super) fn busy(phase: &str) -> bool {
    matches!(
        phase,
        "checking" | "downloading" | "preparing" | "installing"
    )
}

#[tauri::command]
pub(crate) fn get_app_update_state(
    window: WebviewWindow,
    state: State<'_, AppUpdates>,
) -> Result<Snapshot, String> {
    require_window(&window)?;
    Ok(state.lock().snapshot.clone())
}
