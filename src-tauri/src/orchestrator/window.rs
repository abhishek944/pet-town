use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub fn open(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("orchestrator") {
        return window
            .show()
            .and_then(|_| window.set_focus())
            .map_err(|error| error.to_string());
    }
    WebviewWindowBuilder::new(
        app,
        "orchestrator",
        WebviewUrl::App("assistant.html".into()),
    )
    .title("Pet Village Orchestrator")
    .inner_size(520.0, 640.0)
    .min_inner_size(420.0, 520.0)
    .resizable(true)
    .decorations(true)
    .visible(false)
    .build()
    .map(|_| ())
    .map_err(|error| error.to_string())
}
