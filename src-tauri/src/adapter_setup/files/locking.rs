use super::make_private;
use fs2::FileExt;
use std::fs::{self, OpenOptions};
#[cfg(unix)]
use std::os::unix::fs::OpenOptionsExt;
use std::path::Path;

pub(crate) fn with_file_lock<T>(
    path: &Path,
    label: &str,
    action: impl FnOnce() -> Result<T, String>,
) -> Result<T, String> {
    let parent = path
        .parent()
        .ok_or_else(|| format!("{label} path has no parent"))?;
    fs::create_dir_all(parent).map_err(|_| format!("could not create the {label} directory"))?;
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("settings");
    let lock_path = parent.join(format!(".{name}.agent-pets-lock"));
    let mut options = OpenOptions::new();
    options.read(true).write(true).create(true);
    #[cfg(unix)]
    options.custom_flags(libc::O_NOFOLLOW);
    let lock = options
        .open(&lock_path)
        .map_err(|_| format!("could not open {label} lock"))?;
    if !lock.metadata().is_ok_and(|metadata| metadata.is_file()) {
        return Err(format!("{label} lock must be a regular file"));
    }
    make_private(&lock)?;
    lock.lock_exclusive()
        .map_err(|_| format!("could not lock {label}"))?;
    let result = action();
    let _ = lock.unlock();
    result
}
