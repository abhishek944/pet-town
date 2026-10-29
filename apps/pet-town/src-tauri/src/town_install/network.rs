use super::TownInstall;
use futures_util::future::{AbortHandle, Abortable};
use std::{
    fs::File,
    io::Write,
    path::Path,
    time::{Duration, Instant},
};
use tauri::{AppHandle, Manager};

pub(super) async fn fetch(
    client: &reqwest::Client,
    url: &str,
    limit: u64,
    app: &AppHandle,
    path: Option<&Path>,
) -> Result<Vec<u8>, String> {
    let state = app.state::<TownInstall>();
    let (abort, registration) = AbortHandle::new_pair();
    {
        let mut inner = state.lock();
        if inner.cancelled {
            return Err("Pet Town download cancelled.".into());
        }
        inner.abort = Some(abort);
    }
    let result = Abortable::new(fetch_inner(client, url, limit, app, path), registration).await;
    state.lock().abort = None;
    result.map_err(|_| "Pet Town download cancelled.".to_string())?
}
async fn fetch_inner(
    client: &reqwest::Client,
    url: &str,
    limit: u64,
    app: &AppHandle,
    path: Option<&Path>,
) -> Result<Vec<u8>, String> {
    let state = app.state::<TownInstall>();
    state.check_cancel()?;
    let mut response = client
        .get(url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;
    if response.content_length().is_some_and(|n| n > limit) {
        return Err("Pet Town download exceeds its size limit.".into());
    }
    let mut file = path
        .map(File::create)
        .transpose()
        .map_err(|e| e.to_string())?;
    let mut bytes = Vec::new();
    let mut count = 0u64;
    let mut last = Instant::now();
    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        state.check_cancel()?;
        count = count
            .checked_add(chunk.len() as u64)
            .ok_or("Download size overflow.")?;
        if count > limit {
            return Err("Pet Town download exceeds its size limit.".into());
        }
        if let Some(file) = file.as_mut() {
            file.write_all(&chunk).map_err(|e| e.to_string())?;
            state.lock().snapshot.downloaded_bytes = count;
            if last.elapsed() >= Duration::from_millis(100) {
                state.publish(app);
                last = Instant::now();
            }
        } else {
            bytes.extend_from_slice(&chunk);
        }
    }
    if let Some(file) = file {
        file.sync_all().map_err(|e| e.to_string())?;
    }
    state.check_cancel()?;
    Ok(bytes)
}
