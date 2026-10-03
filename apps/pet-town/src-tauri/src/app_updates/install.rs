use super::state::{require_window, AppUpdates};
use std::{ffi::OsStr, path::Path};
use tauri::{AppHandle, Manager, WebviewWindow};

#[tauri::command]
pub(crate) async fn install_app_update(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<(), String> {
    require_window(&window)?;
    install(app).await
}

pub(crate) async fn install(app: AppHandle) -> Result<(), String> {
    if !cfg!(target_os = "macos") || cfg!(debug_assertions) {
        return Err(
            "Install updates from the installed macOS app, not a development build.".into(),
        );
    }
    let executable = std::env::current_exe().map_err(|error| error.to_string())?;
    let bundle = executable
        .parent()
        .and_then(Path::parent)
        .and_then(Path::parent);
    if !executable.ends_with("Contents/MacOS/pet-town")
        || bundle.and_then(Path::extension) != Some(OsStr::new("app"))
    {
        return Err("Install updates from the Pet Town .app, not a standalone executable.".into());
    }
    {
        let state = app.state::<AppUpdates>();
        let mut inner = state.lock();
        if app.get_webview_window("onboarding").is_some()
            || app
                .state::<crate::onboarding::Onboarding>()
                .busy
                .load(std::sync::atomic::Ordering::SeqCst)
        {
            return Err("Close Welcome & setup and wait for its current action before installing an app update.".into());
        }
        if inner.snapshot.phase != "ready" || inner.archive.is_none() || inner.update.is_none() {
            return Err("Download an update before installing it.".into());
        }
        if inner.window_openers != 0 {
            return Err(
                "A Pet Town window is still opening. Try installing again in a moment.".into(),
            );
        }
        // Claim the whole prepare/install operation before awaiting any renderer.
        inner.snapshot.phase = "preparing";
        inner.snapshot.error = None;
    }
    if let Err(error) = super::prepare::run(app.clone()).await {
        return Err(app.state::<AppUpdates>().fail(&app, "ready", error));
    }
    let (update, archive) = {
        let state = app.state::<AppUpdates>();
        let mut inner = state.lock();
        let update = inner
            .update
            .clone()
            .ok_or("The update is no longer available.")?;
        let archive = inner
            .archive
            .take()
            .ok_or("The verified update is no longer available.")?;
        inner.snapshot.phase = "installing";
        (update, archive)
    };
    app.state::<AppUpdates>().publish(&app);
    let result = tauri::async_runtime::spawn_blocking(move || {
        let result = update.install(&archive);
        (archive, result)
    })
    .await;
    match result {
        Ok((_, Ok(()))) => {
            app.state::<AppUpdates>().lock().restart = true;
            // Regular exit allows existing deferred voice/Firstmate cleanup to finish.
            // lib.rs restarts only in the final Exit event, not ExitRequested.
            app.exit(0);
            Ok(())
        }
        Ok((archive, Err(error))) => {
            app.state::<AppUpdates>().lock().archive = Some(archive);
            Err(app.state::<AppUpdates>().fail(
                &app,
                "ready",
                format!("Could not install the update. Your app has not restarted. {error}"),
            ))
        }
        Err(error) => Err(app.state::<AppUpdates>().fail(
            &app,
            "available",
            format!("Installation could not finish. Download the update again. {error}"),
        )),
    }
}
