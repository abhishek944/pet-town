use std::process::Command;

pub(super) fn request(pid: u32) -> Result<(), String> {
    let executable = std::env::current_exe().map_err(|e| e.to_string())?;
    let output = Command::new(executable)
        .args([
            "--focus-native-town",
            &pid.to_string(),
            &std::process::id().to_string(),
        ])
        .env_remove("OPENAI_API_KEY")
        .output()
        .map_err(|e| format!("The town focus helper could not start: {e}"))?;
    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().into())
    }
}

pub(crate) fn activate(pid: u32, parent: u32) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use objc2_app_kit::{NSApplicationActivationOptions, NSRunningApplication};
        use std::time::{Duration, Instant};
        use tauri_nspanel::objc2_foundation::{NSDate, NSRunLoop};
        let output = Command::new("/bin/ps")
            .args(["-p", &pid.to_string(), "-o", "ppid="])
            .output()
            .map_err(|_| "The existing town process could not be verified.")?;
        if !output.status.success()
            || String::from_utf8_lossy(&output.stdout)
                .trim()
                .parse::<u32>()
                != Ok(parent)
        {
            return Err("The existing town exited. Open the town again.".into());
        }
        let app = NSRunningApplication::runningApplicationWithProcessIdentifier(pid as i32)
            .ok_or("The town is still starting. Try opening it again.")?;
        app.unhide();
        // Run on this isolated helper's main thread, outside the overlay GUI.
        let _ = app.activateWithOptions(NSApplicationActivationOptions::empty());
        let deadline = Instant::now() + Duration::from_secs(3);
        loop {
            NSRunLoop::currentRunLoop().runUntilDate(&NSDate::dateWithTimeIntervalSinceNow(0.01));
            if app.isActive() {
                return Ok(());
            }
            if app.isTerminated() || Instant::now() >= deadline {
                return Err("macOS could not bring the existing town window forward.".into());
            }
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (pid, parent);
        Err("The town is already open. Select its native window.".into())
    }
}
