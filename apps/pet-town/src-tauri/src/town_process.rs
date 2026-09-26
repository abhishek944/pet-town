use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

#[derive(Default)]
pub(crate) struct TownProcess(Mutex<Option<Child>>);

pub(crate) fn open(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<TownProcess>();
    let mut stored = state
        .0
        .lock()
        .map_err(|_| "the town process state is unavailable".to_string())?;
    if let Some(child) = stored.as_mut() {
        if child
            .try_wait()
            .map_err(|error| error.to_string())?
            .is_none()
        {
            return activate(child.id());
        }
        *stored = None;
    }

    let runtime = godot_runtime().ok_or_else(|| {
        "Godot 4 is unavailable. Set PET_TOWN_GODOT_BIN to the Godot executable.".to_string()
    })?;
    let project = project_path().ok_or_else(|| {
        "The local Godot town project is unavailable. Set PET_TOWN_GODOT_PROJECT.".to_string()
    })?;
    let bridge = std::env::current_exe().map_err(|error| error.to_string())?;
    let child = Command::new(runtime)
        .args(["--path", project.to_string_lossy().as_ref()])
        .env("PET_TOWN_BRIDGE_BIN", bridge)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| format!("the Godot town could not start: {error}"))?;
    let pid = child.id();
    *stored = Some(child);
    let _ = activate(pid);
    Ok(())
}

pub(crate) fn reap(app: &AppHandle) {
    let state = app.state::<TownProcess>();
    let Ok(mut stored) = state.0.lock() else {
        return;
    };
    let exited = stored
        .as_mut()
        .and_then(|child| child.try_wait().ok())
        .is_some();
    if exited {
        *stored = None;
        let _ = crate::village_visibility::set_town_active(app, false);
    }
}

pub(crate) fn stop(app: &AppHandle) {
    let state = app.state::<TownProcess>();
    let child = state.0.lock().ok().and_then(|mut stored| stored.take());
    if let Some(mut child) = child {
        let _ = child.kill();
        let _ = child.wait();
    }
    let _ = crate::village_visibility::set_town_active(app, false);
}

fn godot_runtime() -> Option<PathBuf> {
    if let Some(path) = executable_env("PET_TOWN_GODOT_BIN") {
        return Some(path);
    }
    if let Some(path) = branded_godot_runtime() {
        return Some(path);
    }
    let mut candidates = vec![
        PathBuf::from("/Applications/Godot.app/Contents/MacOS/Godot"),
        repository_root().join("var/godot-runtime/Godot.app/Contents/MacOS/Godot"),
    ];
    if let Some(home) = std::env::var_os("HOME") {
        candidates.push(PathBuf::from(home).join("Applications/Godot.app/Contents/MacOS/Godot"));
    }
    candidates
        .into_iter()
        .find(|candidate| candidate.is_file())
        .or_else(|| executable_on_path("godot"))
        .or_else(|| executable_on_path("Godot"))
}

#[cfg(target_os = "macos")]
fn branded_godot_runtime() -> Option<PathBuf> {
    let root = repository_root();
    let script = root.join("scripts/prepare-pet-town-godot-app.sh");
    let source = root.join("var/godot-runtime/Godot.app");
    if !script.is_file() || !source.is_dir() {
        return None;
    }
    let output = Command::new("sh").arg(script).arg(source).output().ok()?;
    if !output.status.success() {
        return None;
    }
    let path = PathBuf::from(String::from_utf8(output.stdout).ok()?.trim());
    path.is_file().then_some(path)
}

#[cfg(not(target_os = "macos"))]
fn branded_godot_runtime() -> Option<PathBuf> {
    None
}

fn project_path() -> Option<PathBuf> {
    if let Some(path) = std::env::var_os("PET_TOWN_GODOT_PROJECT") {
        let path = PathBuf::from(path);
        if path.join("project.godot").is_file() {
            return Some(path);
        }
    }
    let candidates = [
        repository_root().join("apps/pet-town-godot-next"),
        std::env::current_dir().ok()?.join("apps/pet-town-godot-next"),
        repository_root().join("apps/pet-town-godot"),
        std::env::current_dir().ok()?.join("apps/pet-town-godot"),
    ];
    candidates
        .into_iter()
        .find(|candidate| candidate.join("project.godot").is_file())
}

fn repository_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(3)
        .unwrap_or_else(|| Path::new(env!("CARGO_MANIFEST_DIR")))
        .to_path_buf()
}

fn executable_env(name: &str) -> Option<PathBuf> {
    let path = PathBuf::from(std::env::var_os(name)?);
    path.is_file().then_some(path)
}

fn executable_on_path(name: &str) -> Option<PathBuf> {
    std::env::var_os("PATH")
        .into_iter()
        .flat_map(|paths| std::env::split_paths(&paths).collect::<Vec<_>>())
        .map(|directory| directory.join(name))
        .find(|candidate| candidate.is_file())
}

#[cfg(target_os = "macos")]
fn activate(pid: u32) -> Result<(), String> {
    crate::macos_app_focus::activate_process(pid)
}

#[cfg(not(target_os = "macos"))]
fn activate(_pid: u32) -> Result<(), String> {
    Ok(())
}
