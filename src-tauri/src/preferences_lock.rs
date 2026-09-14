use fs2::FileExt;
use std::fs::OpenOptions;
use std::path::Path;

pub fn exclusive<T>(
    preferences: &Path,
    action: impl FnOnce() -> Result<T, String>,
) -> Result<T, String> {
    let parent = preferences
        .parent()
        .ok_or_else(|| "preferences path has no parent".to_string())?;
    std::fs::create_dir_all(parent)
        .map_err(|_| "could not create preferences folder".to_string())?;
    let path = parent.join(".preferences.lock");
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(path)
        .map_err(|_| "could not open the preferences lock".to_string())?;
    file.lock_exclusive()
        .map_err(|_| "could not lock preferences".to_string())?;
    let result = action();
    let _ = file.unlock();
    result
}
