use serde::Serialize;
use std::sync::{Mutex, MutexGuard};
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Snapshot {
    pub revision: u64,
    pub phase: &'static str,
    pub installed_version: Option<String>,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub error: Option<String>,
}

pub(super) struct Inner {
    pub snapshot: Snapshot,
    pub validated: Option<bool>,
    pub busy: bool,
    pub cancelled: bool,
    pub committed: bool,
    pub abort: Option<futures_util::future::AbortHandle>,
}

pub(crate) struct TownInstall {
    inner: Mutex<Inner>,
    pub(super) mutation: Mutex<()>,
}

impl Default for TownInstall {
    fn default() -> Self {
        Self {
            inner: Mutex::new(Inner {
                snapshot: Snapshot {
                    revision: 0,
                    phase: "absent",
                    installed_version: None,
                    downloaded_bytes: 0,
                    total_bytes: None,
                    error: None,
                },
                validated: None,
                busy: false,
                cancelled: false,
                committed: false,
                abort: None,
            }),
            mutation: Mutex::new(()),
        }
    }
}

impl TownInstall {
    pub(super) fn lock(&self) -> MutexGuard<'_, Inner> {
        self.inner.lock().unwrap_or_else(|e| e.into_inner())
    }
    pub(super) fn publish(&self, app: &AppHandle) -> Snapshot {
        let snapshot = {
            let mut inner = self.lock();
            inner.snapshot.revision += 1;
            inner.snapshot.clone()
        };
        let _ = app.emit_to("settings", "town-install-state", &snapshot);
        snapshot
    }
    pub(super) fn phase(&self, app: &AppHandle, phase: &'static str) {
        self.lock().snapshot.phase = phase;
        self.publish(app);
    }
    pub(super) fn check_cancel(&self) -> Result<(), String> {
        if self.lock().cancelled {
            Err("Pet Town download cancelled.".into())
        } else {
            Ok(())
        }
    }
}
