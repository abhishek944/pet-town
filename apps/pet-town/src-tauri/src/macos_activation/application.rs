use objc2_app_kit::{NSApplicationActivationOptions, NSRunningApplication};
use std::time::{Duration, Instant};

/// Called on the headless helper's main thread for both Herdr backends.
pub(super) fn activate(
    application: &NSRunningApplication,
    timeout: Duration,
) -> Result<(), String> {
    crate::focus_trace::application("Herdr host before", application);
    // Raising every host window exposes unrelated default windows first.
    application.unhide();
    if !application.activateWithOptions(NSApplicationActivationOptions::empty()) {
        return Err("macOS refused to activate the Herdr UI application".to_string());
    }
    let deadline = Instant::now() + timeout;
    while !application.isActive() {
        if Instant::now() >= deadline {
            return Err("the Herdr UI application did not become active".to_string());
        }
        use tauri_nspanel::objc2_foundation::{NSDate, NSRunLoop};
        NSRunLoop::currentRunLoop().runUntilDate(&NSDate::dateWithTimeIntervalSinceNow(0.01));
    }
    std::thread::sleep(Duration::from_millis(150));
    crate::focus_trace::application("Herdr host after", application);
    Ok(())
}

pub(crate) fn activate_herdr_core() -> Result<(), String> {
    let applications: Vec<_> = super::process_snapshot()?
        .into_iter()
        .filter_map(|process| {
            let app = NSRunningApplication::runningApplicationWithProcessIdentifier(process.pid)?;
            app.bundleIdentifier()
                .is_some_and(|id| id.to_string() == "dev.herdr.app")
                .then_some(app)
        })
        .collect();
    if applications.len() != 1 {
        return Err("Could not identify one running Herdr Core desktop app.".into());
    }
    activate(&applications[0], super::ACTIVATION_TIMEOUT)
}
