use objc2_app_kit::{NSApplicationActivationOptions, NSRunningApplication};
use std::process::Command;

const MAX_PROCESS_OUTPUT_BYTES: usize = 1024 * 1024;

pub(crate) fn activate_running_application(bundle_id: &str) -> Result<(), String> {
    let output = Command::new("/bin/ps")
        .env_remove("OPENAI_API_KEY")
        .args(["-axo", "pid="])
        .output()
        .map_err(|_| "could not inspect running applications".to_string())?;
    if !output.status.success() || output.stdout.len() > MAX_PROCESS_OUTPUT_BYTES {
        return Err("could not inspect running applications".to_string());
    }
    for pid in String::from_utf8_lossy(&output.stdout)
        .lines()
        .filter_map(|line| line.trim().parse().ok())
    {
        let Some(application) = NSRunningApplication::runningApplicationWithProcessIdentifier(pid)
        else {
            continue;
        };
        let matches = application
            .bundleIdentifier()
            .map(|identifier| identifier.to_string() == bundle_id)
            .unwrap_or(false);
        if !matches {
            continue;
        }
        application.unhide();
        return application
            .activateWithOptions(NSApplicationActivationOptions::ActivateAllWindows)
            .then_some(())
            .ok_or_else(|| "macOS refused to activate the agent application".to_string());
    }
    Err("the agent application is not running".to_string())
}
