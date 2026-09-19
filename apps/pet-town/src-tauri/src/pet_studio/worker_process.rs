use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};

static WORKERS: OnceLock<Mutex<HashMap<PathBuf, u32>>> = OnceLock::new();

fn workers() -> &'static Mutex<HashMap<PathBuf, u32>> {
    WORKERS.get_or_init(Default::default)
}

fn canonical(directory: &Path) -> PathBuf {
    std::fs::canonicalize(directory).unwrap_or_else(|_| directory.to_path_buf())
}

pub struct WorkerGuard {
    pid: u32,
    finished: bool,
}

impl WorkerGuard {
    pub fn register(pid: u32, directory: &Path) -> Self {
        workers()
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .insert(canonical(directory), pid);
        Self {
            pid,
            finished: false,
        }
    }

    pub fn finish(&mut self) {
        self.finished = true;
        remove(self.pid);
    }
}

impl Drop for WorkerGuard {
    fn drop(&mut self) {
        if !self.finished {
            stop(self.pid, false);
            remove(self.pid);
        }
    }
}

fn remove(pid: u32) {
    workers()
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .retain(|_, active_pid| *active_pid != pid);
}

pub fn stop_directory(directory: &Path, force: bool) {
    if let Some(pid) = workers()
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .get(directory)
        .copied()
    {
        stop(pid, force);
    }
}

pub fn stop_all(force: bool) {
    let pids = workers()
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .values()
        .copied()
        .collect::<Vec<_>>();
    for pid in pids {
        stop(pid, force);
    }
}

#[cfg(unix)]
fn stop(pid: u32, force: bool) {
    let signal = if force { libc::SIGKILL } else { libc::SIGTERM };
    unsafe {
        libc::kill(pid as i32, signal);
    }
}

#[cfg(not(unix))]
fn stop(_pid: u32, _force: bool) {}
