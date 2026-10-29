use std::process::{Child, Command, Stdio};
use tauri::{AppHandle, Manager};

pub(super) fn spawn(app: &AppHandle, port: u16, token: &str) -> Result<Child, String> {
    let (executable, project) = crate::town_install::launch_path(app)?;
    if executable.components().count() > 1 && !executable.is_file() {
        return Err("The Pet Town runtime is missing. Run pnpm run dev or rebuild the app.".into());
    }
    let mut command = Command::new(executable);
    let log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;
    command
        .arg("--log-file")
        .arg(log_dir.join("native-town.log"));
    if let Some(project) = project {
        if project.join("PetTown.pck").is_file() {
            command.arg("--main-pack").arg(project.join("PetTown.pck"));
        } else {
            command.arg("--path").arg(project);
        }
    }
    command
        .arg("--fullscreen")
        .args(["--accessibility", "always"])
        .env("PET_TOWN_BRIDGE_PORT", port.to_string())
        .env("PET_TOWN_BRIDGE_TOKEN", token)
        .env("PET_TOWN_DESKTOP_PID", std::process::id().to_string())
        .env_remove("OPENAI_API_KEY")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("The Godot town could not start: {e}"))
}

pub(super) fn focus(pid: u32) -> Result<(), String> {
    super::focus::request(pid)
}

pub(super) fn close(child: &mut Child) -> Result<bool, String> {
    // Check the owned child before targeting its PID; exited/reaped PIDs may be reused.
    if child
        .try_wait()
        .map_err(|error| error.to_string())?
        .is_some()
    {
        return Ok(false);
    }
    #[cfg(target_os = "macos")]
    {
        // A normal app quit delivers Godot's close notification even if its
        // companion bridge is disconnected. Never forceTerminate here.
        let town = objc2_app_kit::NSRunningApplication::runningApplicationWithProcessIdentifier(
            child.id() as i32,
        )
        .ok_or("Pet Town is still starting. Try Close Pet Town again.")?;
        if town.terminate() {
            Ok(true)
        } else {
            Err("Pet Town could not accept the close request.".into())
        }
    }
    #[cfg(not(target_os = "macos"))]
    Err("Close Pet Town from its native window on this platform.".into())
}

pub(super) fn is_focused(pid: u32) -> bool {
    #[cfg(target_os = "macos")]
    {
        objc2_app_kit::NSRunningApplication::runningApplicationWithProcessIdentifier(pid as i32)
            .is_some_and(|app| app.isActive())
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = pid;
        true
    }
}
