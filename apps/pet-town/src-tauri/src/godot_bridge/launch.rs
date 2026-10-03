use std::{
    path::PathBuf,
    process::{Child, Command, Stdio},
};
use tauri::{AppHandle, Manager};

pub(super) fn spawn(app: &AppHandle, port: u16, token: &str) -> Result<Child, String> {
    let resource = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("resources/godot");
    let bundled = resource.join("PetTown");
    let (executable, project) = if bundled.is_file() {
        (bundled, None)
    } else {
        let checkout = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..");
        let project = if cfg!(debug_assertions) {
            checkout.join("apps/pet-town-godot-sample")
        } else {
            resource.join("world")
        };
        if !project.join("project.godot").is_file() && !project.join("PetTown.pck").is_file() {
            return Err("The native Godot town is missing from this installation.".into());
        }
        let executable = if cfg!(debug_assertions) {
            std::env::var_os("PET_TOWN_GODOT_EXECUTABLE")
                .map(PathBuf::from)
                .or_else(|| {
                    [
                        checkout.join("var/godot-runtime/Godot.app/Contents/MacOS/Godot"),
                        PathBuf::from("/Applications/Godot.app/Contents/MacOS/Godot"),
                    ]
                    .into_iter()
                    .find(|p| p.is_file())
                })
                .unwrap_or_else(|| PathBuf::from("godot"))
        } else {
            resource.join("Godot.app/Contents/MacOS/Godot")
        };
        (executable, Some(project))
    };
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
