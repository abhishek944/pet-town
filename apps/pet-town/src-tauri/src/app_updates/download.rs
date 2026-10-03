use super::state::{busy, require_window, AppUpdates, Snapshot};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_updater::UpdaterExt;

pub(crate) async fn check(app: AppHandle) -> Result<Snapshot, String> {
    {
        let state = app.state::<AppUpdates>();
        let mut inner = state.lock();
        if busy(inner.snapshot.phase) {
            return Err("An update operation is already in progress.".into());
        }
        inner.snapshot.phase = "checking";
        inner.snapshot.error = None;
        inner.snapshot.available_version = None;
        inner.snapshot.notes = None;
        inner.snapshot.downloaded_bytes = 0;
        inner.snapshot.total_bytes = None;
        inner.update = None;
        inner.archive = None;
    }
    app.state::<AppUpdates>().publish(&app);
    let result = async {
        app.updater_builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|error| error.to_string())?
            .check()
            .await
            .map_err(|error| error.to_string())
    }
    .await;
    match result {
        Ok(update) => {
            {
                let state = app.state::<AppUpdates>();
                let mut inner = state.lock();
                inner.snapshot.phase = if update.is_some() {
                    "available"
                } else {
                    "current"
                };
                inner.snapshot.available_version = update.as_ref().map(|item| item.version.clone());
                inner.snapshot.notes = update.as_ref().and_then(|item| item.body.clone());
                inner.update = update;
            }
            app.state::<AppUpdates>().publish(&app);
            Ok(app.state::<AppUpdates>().lock().snapshot.clone())
        }
        Err(error) => Err(app.state::<AppUpdates>().fail(
            &app,
            "error",
            format!("Could not check for updates. {error}"),
        )),
    }
}

#[tauri::command]
pub(crate) async fn check_app_updates(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<Snapshot, String> {
    require_window(&window)?;
    check(app).await
}

#[tauri::command]
pub(crate) async fn download_app_update(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<Snapshot, String> {
    require_window(&window)?;
    download(app).await
}

pub(crate) async fn download(app: AppHandle) -> Result<Snapshot, String> {
    let update = {
        let state = app.state::<AppUpdates>();
        let mut inner = state.lock();
        if inner.snapshot.phase != "available" {
            return Err("Check for an available update before downloading.".into());
        }
        let mut update = inner.update.clone().ok_or("No update is available.")?;
        // The bundled Node/Pi runtime makes these larger than the landing-page assets.
        update.timeout = Some(Duration::from_secs(15 * 60));
        inner.snapshot.phase = "downloading";
        inner.snapshot.error = None;
        inner.snapshot.downloaded_bytes = 0;
        inner.snapshot.total_bytes = None;
        update
    };
    app.state::<AppUpdates>().publish(&app);
    let progress_app = app.clone();
    let mut last_publication = Instant::now();
    let result = update
        .download(
            move |chunk, total| {
                let state = progress_app.state::<AppUpdates>();
                {
                    let mut inner = state.lock();
                    inner.snapshot.downloaded_bytes =
                        inner.snapshot.downloaded_bytes.saturating_add(chunk as u64);
                    inner.snapshot.total_bytes = total;
                }
                if last_publication.elapsed() >= Duration::from_millis(100) {
                    state.publish(&progress_app);
                    last_publication = Instant::now();
                }
            },
            || {},
        )
        .await;
    let result = match result {
        Ok(archive) => {
            let version = update.version.clone();
            let identifier = app.config().identifier.clone();
            tauri::async_runtime::spawn_blocking(move || {
                let valid = super::archive::validate(&archive, &version, &identifier);
                (archive, valid)
            })
            .await
            .map_err(|error| error.to_string())
            .and_then(|(archive, valid)| valid.map(|()| archive))
        }
        Err(error) => Err(error.to_string()),
    };
    match result {
        Ok(archive) => {
            {
                let state = app.state::<AppUpdates>();
                let mut inner = state.lock();
                inner.snapshot.phase = "ready";
                inner.snapshot.downloaded_bytes = archive.len() as u64;
                inner.snapshot.total_bytes = Some(archive.len() as u64);
                inner.archive = Some(archive);
            }
            app.state::<AppUpdates>().publish(&app);
            Ok(app.state::<AppUpdates>().lock().snapshot.clone())
        }
        Err(error) => Err(app.state::<AppUpdates>().fail(
            &app,
            "available",
            format!("Could not download or verify the update. {error}"),
        )),
    }
}
