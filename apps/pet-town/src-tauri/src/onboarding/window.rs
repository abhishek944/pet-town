use super::Onboarding;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
pub(crate) const LABEL: &str = "onboarding";

pub(super) fn installation_ready() -> bool {
    if cfg!(debug_assertions) {
        return true;
    }
    std::env::current_exe().ok().is_some_and(|path| {
        path.ancestors()
            .find(|p| p.extension().is_some_and(|ext| ext == "app"))
            .is_some_and(|bundle| {
                bundle.parent().is_some_and(|dir| {
                    dir == std::path::Path::new("/Applications")
                        || std::env::var_os("HOME").is_some_and(|home| {
                            dir == std::path::PathBuf::from(home).join("Applications")
                        })
                })
            })
    })
}

pub(crate) fn should_open(app: &AppHandle) -> bool {
    !app.state::<Onboarding>().store.get().completed || !installation_ready()
}

pub(crate) fn start(app: &AppHandle) {
    let state = app.state::<Onboarding>();
    if should_open(app) {
        // Persist admission before scenery changes create preferences on a fresh install.
        let _ = state.store.update(|_| {});
        if let Err(error) = open(app) {
            eprintln!("Could not open Pet Town setup: {error}");
        }
    }
}

pub(crate) fn open(app: &AppHandle) -> Result<(), String> {
    let updates = app.state::<crate::app_updates::AppUpdates>();
    let _opening = updates.window_opening()?;
    if let Some(window) = app.get_webview_window(LABEL) {
        return window
            .show()
            .and_then(|_| window.set_focus())
            .map_err(|e| e.to_string());
    }
    WebviewWindowBuilder::new(app, LABEL, WebviewUrl::App("onboarding.html".into()))
        .title("Welcome to Pet Town")
        .inner_size(880.0, 688.0)
        .min_inner_size(880.0, 560.0)
        .resizable(true)
        .center()
        .build()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

pub(super) fn require(window: &WebviewWindow) -> Result<(), String> {
    let url = window.url().map_err(|_| "Setup window is unavailable.")?;
    let packaged = (url.scheme() == "tauri" && url.host_str() == Some("localhost"))
        || (url.scheme() == "http" && url.host_str() == Some("tauri.localhost"));
    let development = cfg!(debug_assertions)
        && url.scheme() == "http"
        && matches!(url.host_str(), Some("localhost" | "127.0.0.1"))
        && url.port() == Some(1420);
    if window.label() != LABEL || url.path() != "/onboarding.html" || !(packaged || development) {
        return Err("This action is available only in local Pet Town setup.".into());
    }
    Ok(())
}

pub(super) fn require_installation() -> Result<(), String> {
    installation_ready().then_some(()).ok_or_else(|| {
        "Move Pet Town to Applications, then open it there before continuing setup.".into()
    })
}
