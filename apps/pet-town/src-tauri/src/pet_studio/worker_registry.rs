use super::worker_process;
pub use super::worker_process::WorkerGuard;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Condvar, Mutex, OnceLock};
use std::time::Duration;

const GRACEFUL_STOP: Duration = Duration::from_secs(3);
static SHUTTING_DOWN: AtomicBool = AtomicBool::new(false);
static OPERATION: OnceLock<(Mutex<OperationState>, Condvar)> = OnceLock::new();

#[derive(Default)]
struct OperationState {
    id: u64,
    directory: Option<PathBuf>,
    cancelled: bool,
}

fn operation() -> &'static (Mutex<OperationState>, Condvar) {
    OPERATION.get_or_init(|| (Mutex::new(OperationState::default()), Condvar::new()))
}

fn canonical(directory: &Path) -> PathBuf {
    std::fs::canonicalize(directory).unwrap_or_else(|_| directory.to_path_buf())
}

pub struct GenerationGuard {
    id: u64,
}

impl GenerationGuard {
    pub fn begin(directory: &Path) -> Result<Self, String> {
        if SHUTTING_DOWN.load(Ordering::Acquire) {
            return Err("Pet Studio is shutting down.".into());
        }
        let mut current = operation()
            .0
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        if current.directory.is_some() {
            return Err("Another Pet Studio generation is already running.".into());
        }
        if SHUTTING_DOWN.load(Ordering::Acquire) {
            return Err("Pet Studio is shutting down.".into());
        }
        current.id = current.id.wrapping_add(1);
        current.directory = Some(canonical(directory));
        current.cancelled = false;
        Ok(Self { id: current.id })
    }

    pub fn cancelled(&self) -> bool {
        let current = operation()
            .0
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        current.id == self.id && current.cancelled
    }
}

impl Drop for GenerationGuard {
    fn drop(&mut self) {
        let (state, changed) = operation();
        let mut current = state.lock().unwrap_or_else(|error| error.into_inner());
        if current.id == self.id {
            current.directory = None;
            current.cancelled = false;
        }
        changed.notify_all();
    }
}

pub fn cancelled() -> bool {
    operation()
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .cancelled
}

pub fn stop_for(directory: &Path) {
    let target = canonical(directory);
    let id = {
        let mut current = operation()
            .0
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        if current.directory.as_ref() != Some(&target) {
            return;
        }
        current.cancelled = true;
        current.id
    };
    worker_process::stop_directory(&target, false);
    wait_then_force(id, Some(&target));
}

pub fn stop_all() {
    SHUTTING_DOWN.store(true, Ordering::Release);
    let id = {
        let mut current = operation()
            .0
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        current.cancelled = true;
        current.id
    };
    worker_process::stop_all(false);
    wait_then_force(id, None);
}

fn wait_then_force(id: u64, directory: Option<&PathBuf>) {
    let (state, changed) = operation();
    let current = state.lock().unwrap_or_else(|error| error.into_inner());
    let (current, _) = changed
        .wait_timeout_while(current, GRACEFUL_STOP, |item| {
            item.id == id && item.directory.is_some()
        })
        .unwrap_or_else(|error| error.into_inner());
    if current.id != id || current.directory.is_none() {
        return;
    }
    drop(current);
    if let Some(directory) = directory {
        worker_process::stop_directory(directory, true);
    } else {
        worker_process::stop_all(true);
    }
    let current = state.lock().unwrap_or_else(|error| error.into_inner());
    drop(
        changed
            .wait_while(current, |item| item.id == id && item.directory.is_some())
            .unwrap_or_else(|error| error.into_inner()),
    );
}
