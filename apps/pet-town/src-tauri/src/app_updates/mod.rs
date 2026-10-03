mod archive;
pub(crate) mod download;
pub(crate) mod install;
pub(crate) mod prepare;
pub(crate) mod state;

pub(crate) use state::AppUpdates;

pub(crate) fn start(app: tauri::AppHandle) {
    // Development processes are not installed .app bundles and must not self-replace.
    if cfg!(debug_assertions) {
        return;
    }
    tauri::async_runtime::spawn(async move {
        let _ = download::check(app).await;
    });
}
