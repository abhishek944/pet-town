// Temporary, debug-only input tracing while diagnosing native Pet Street.
pub(crate) fn record(stage: &str) {
    #[cfg(debug_assertions)]
    {
        use std::io::Write;
        static LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());
        let Ok(_guard) = LOCK.lock() else { return };
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../../var/2d-pet-focus/implement-details/input.log");
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();
        if let Ok(mut file) = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
        {
            let _ = writeln!(file, "{timestamp} pid={} {stage}", std::process::id());
        }
    }
}

#[cfg(target_os = "macos")]
pub(crate) fn application(stage: &str, application: &objc2_app_kit::NSRunningApplication) {
    record(&format!(
        "{stage}: pid={} bundle={:?} active={} current-active={}",
        application.processIdentifier(),
        application.bundleIdentifier().map(|id| id.to_string()),
        application.isActive(),
        objc2_app_kit::NSRunningApplication::currentApplication().isActive(),
    ));
}

#[cfg(target_os = "macos")]
pub(crate) fn frontmost(stage: &str) {
    if let Some(app) = objc2_app_kit::NSWorkspace::sharedWorkspace().frontmostApplication() {
        application(stage, &app);
    }
}

#[tauri::command]
pub(crate) fn trace_pet_input(stage: String) {
    if [
        "ready",
        "pointerdown",
        "pointerup",
        "pointercancel",
        "click",
        "contextmenu",
    ]
    .contains(&stage.as_str())
    {
        record(&stage);
    }
}
