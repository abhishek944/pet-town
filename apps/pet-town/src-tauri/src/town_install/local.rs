use serde::Deserialize;
use std::{
    fs,
    io::Read,
    path::{Path, PathBuf},
    process::Command,
};
use tauri::{AppHandle, Manager};

pub(super) const VERSION: &str = env!("CARGO_PKG_VERSION");
pub(super) const BUNDLE: &str = "dev.pet.town.native";
pub(super) fn target() -> Result<&'static str, String> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("macos", "aarch64") => Ok("darwin-aarch64"),
        ("macos", "x86_64") => Ok("darwin-x86_64"),
        _ => Err("Pet Town downloads currently support macOS only.".into()),
    }
}
pub(super) fn root(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("town-component"))
}
pub(super) fn selected(app: &AppHandle) -> Result<PathBuf, String> {
    let root = root(app)?;
    let id: String =
        serde_json::from_slice(&fs::read(root.join("active.json")).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;
    uuid::Uuid::parse_str(&id).map_err(|_| "Invalid Town installation pointer.")?;
    Ok(root.join(id))
}
pub(super) fn installed_version(app: &AppHandle) -> Option<String> {
    let metadata: Metadata =
        serde_json::from_slice(&fs::read(selected(app).ok()?.join("town-component.json")).ok()?)
            .ok()?;
    Some(metadata.version)
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Metadata {
    format_version: u32,
    version: String,
    target: String,
    bundle_identifier: String,
}

pub(super) fn validate(path: &Path) -> Result<PathBuf, String> {
    let bytes = fs::read(path.join("town-component.json")).map_err(|e| e.to_string())?;
    let metadata: Metadata = serde_json::from_slice(&bytes).map_err(|e| e.to_string())?;
    if metadata.format_version != 1
        || metadata.version != VERSION
        || metadata.target != target()?
        || metadata.bundle_identifier != BUNDLE
    {
        return Err(
            "This Pet Town component does not match the installed Pet Street version.".into(),
        );
    }
    let bundle = path.join("Pet Town.app");
    let executable = bundle.join("Contents/MacOS/Godot");
    if !executable.is_file() || !bundle.join("Contents/Resources/Godot.pck").is_file() {
        return Err("The Pet Town component is incomplete.".into());
    }
    validate_executable(&executable)?;
    let plist =
        plist::Value::from_file(bundle.join("Contents/Info.plist")).map_err(|e| e.to_string())?;
    let plist = plist
        .as_dictionary()
        .ok_or("Invalid Town bundle metadata.")?;
    if plist
        .get("CFBundleIdentifier")
        .and_then(plist::Value::as_string)
        != Some(BUNDLE)
        || plist
            .get("CFBundleShortVersionString")
            .and_then(plist::Value::as_string)
            != Some(VERSION)
        || plist
            .get("CFBundleVersion")
            .and_then(plist::Value::as_string)
            != Some(VERSION)
        || plist
            .get("CFBundleExecutable")
            .and_then(plist::Value::as_string)
            != Some("Godot")
    {
        return Err("Unexpected Pet Town bundle identity or version.".into());
    }
    let host = std::env::current_exe().map_err(|e| e.to_string())?;
    let host_team = team(&host)?;
    let requirement = format!("anchor apple generic and identifier \"{BUNDLE}\" and certificate leaf[subject.OU] = \"{host_team}\"");
    let status = Command::new("/usr/bin/codesign")
        .args(["--verify", "--deep", "--strict", "-R", &requirement])
        .arg(&bundle)
        .output()
        .map_err(|e| e.to_string())?;
    if !status.status.success() {
        return Err("Pet Town's macOS signature could not be verified.".into());
    }
    let assessment = Command::new("/usr/sbin/spctl")
        .args(["--assess", "--type", "execute"])
        .arg(&bundle)
        .output()
        .map_err(|e| e.to_string())?;
    if !assessment.status.success() {
        return Err(
            "macOS did not approve this Pet Town component. Install a signed, notarized release."
                .into(),
        );
    }
    Ok(executable)
}
fn validate_executable(path: &Path) -> Result<(), String> {
    let mut file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut header = [0u8; 8];
    file.read_exact(&mut header).map_err(|e| e.to_string())?;
    let cpu: u32 = if target()? == "darwin-aarch64" {
        0x0100000c
    } else {
        0x01000007
    };
    if header[..4] != [0xcf, 0xfa, 0xed, 0xfe]
        || u32::from_le_bytes(
            header[4..8]
                .try_into()
                .map_err(|_| "Invalid Mach-O header.")?,
        ) != cpu
    {
        return Err("The Pet Town executable does not match this Mac's architecture.".into());
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if file
            .metadata()
            .map_err(|e| e.to_string())?
            .permissions()
            .mode()
            & 0o111
            == 0
        {
            return Err("The Pet Town runtime is not executable.".into());
        }
    }
    Ok(())
}
fn team(path: &Path) -> Result<String, String> {
    let output = Command::new("/usr/bin/codesign")
        .args(["-d", "--verbose=4"])
        .arg(path)
        .output()
        .map_err(|e| e.to_string())?;
    let team = String::from_utf8_lossy(&output.stderr)
        .lines()
        .find_map(|line| line.strip_prefix("TeamIdentifier=").map(str::to_owned))
        .ok_or("The host app has no signing team.")?;
    if !output.status.success()
        || team.is_empty()
        || !team.bytes().all(|c| c.is_ascii_alphanumeric())
    {
        return Err("The host app has no valid signing team.".into());
    }
    Ok(team)
}
pub(super) fn resolve(app: &AppHandle) -> Result<PathBuf, String> {
    selected(app).and_then(|p| validate(&p)).map_err(|_| {
        "Download the matching Pet Town component in Settings → App before opening Pet Town.".into()
    })
}
pub(super) fn development() -> Option<(PathBuf, Option<PathBuf>)> {
    if !cfg!(debug_assertions) {
        return None;
    }
    let checkout = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let project = checkout.join("apps/pet-town-godot-sample");
    let executable = std::env::var_os("PET_TOWN_GODOT_EXECUTABLE")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            if cfg!(target_os = "macos") {
                checkout.join("var/godot-runtime/Pet Town.app/Contents/MacOS/Godot")
            } else {
                PathBuf::from("godot")
            }
        });
    if !project.join("project.godot").is_file()
        || (executable.components().count() > 1 && !executable.is_file())
    {
        return None;
    }
    Some((executable, Some(project)))
}
