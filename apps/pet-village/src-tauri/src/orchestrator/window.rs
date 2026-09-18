use tauri::{AppHandle, LogicalPosition, Manager, Position, WebviewUrl, WebviewWindowBuilder};

const RUNTIME_POSITION: LogicalPosition<f64> = LogicalPosition::new(0.0, 0.0);

pub fn destroy(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("orchestrator") {
        let _ = window.destroy();
    }
}

pub fn open_hidden(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("orchestrator") {
        window
            .set_position(Position::Logical(RUNTIME_POSITION))
            .map_err(|error| error.to_string())?;
        return window.show().map_err(|error| error.to_string());
    }
    WebviewWindowBuilder::new(
        app,
        "orchestrator",
        WebviewUrl::App("assistant.html".into()),
    )
    .title("Pet Village Voice Runtime")
    .inner_size(1.0, 1.0)
    .position(RUNTIME_POSITION.x, RUNTIME_POSITION.y)
    .resizable(false)
    .decorations(false)
    .focused(false)
    .skip_taskbar(true)
    // WebKit will not resolve microphone capture for a hidden or offscreen
    // page. Keep the 1px undecorated runtime onscreen without exposing UI.
    .visible(true)
    .build()
    .map(|_| ())
    .map_err(|error| error.to_string())
}
