use std::fs::{File, OpenOptions};
use std::io::Write;
use std::os::fd::AsRawFd;
use std::path::PathBuf;

pub(crate) struct AppLock {
    _file: File,
}

pub(crate) fn lock_path() -> PathBuf {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            std::env::temp_dir().join(format!("pet-town-{}", unsafe { libc::geteuid() }))
        })
        .join(".local/state/pet-town/app.lock")
}

pub(crate) fn acquire_or_notify() -> Result<Option<AppLock>, String> {
    let path = lock_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let mut file = OpenOptions::new()
        .create(true)
        .truncate(false)
        .read(true)
        .write(true)
        .open(&path)
        .map_err(|error| error.to_string())?;
    let acquired = unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) } == 0;
    if !acquired {
        // A service restart may race the old process; only explicit user actions open Settings.
        return Ok(None);
    }
    file.set_len(0).map_err(|error| error.to_string())?;
    file.write_all(format!("{}\n", std::process::id()).as_bytes())
        .map_err(|error| error.to_string())?;
    file.sync_data().map_err(|error| error.to_string())?;
    Ok(Some(AppLock { _file: file }))
}
