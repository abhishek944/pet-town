use super::Onboarding;
use std::{fs, process::Command};
use tauri::{AppHandle, Manager};

fn quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

pub(super) fn open_herdr() -> Result<(), String> {
    let executable =
        std::env::current_exe().map_err(|_| "Pet Town’s setup helper is unavailable.")?;
    let result = crate::herdr_command::run_herdr_command_with_timeout(
        &executable.into_os_string(),
        None,
        &["--onboarding-herdr".into()],
        std::time::Duration::from_secs(20),
    );
    if result.is_some_and(|v| v.trim() == "ok") {
        Ok(())
    } else {
        Err("Herdr could not be opened safely. Open your existing Herdr window, then return to setup.".into())
    }
}

pub(super) fn open_herdr_from_cli() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    if super::dependency::check().phase == "ready" {
        return crate::macos_activation::activate_herdr_host(&crate::orchestrator::herdr_binary(), std::env::var("HERDR_SOCKET_PATH").ok().as_deref())
            .map_err(|_| "Herdr is running, but its window could not be selected safely. Open your existing Herdr window and return to setup.".into());
    }
    // A terminal UI cannot be opened as a Cocoa application. The system terminal runs
    // a fixed, private launcher containing only the validated local executable path.
    let binary = crate::orchestrator::herdr_binary();
    let executable =
        super::tools::executable("herdr").unwrap_or_else(|| std::path::PathBuf::from(binary));
    if !executable.is_file() {
        return Err("Install Herdr before opening it.".into());
    }
    let folder = crate::preferences_io::preferences_path()?.with_file_name("onboarding-launcher");
    fs::create_dir_all(&folder).map_err(|_| "Could not prepare the Herdr launcher.")?;
    crate::preferences_permissions::restrict_directory(&folder)?;
    let path = folder.join("Open Herdr.command");
    fs::write(
        &path,
        format!("#!/bin/sh\nexec {}\n", quote(&executable.to_string_lossy())),
    )
    .map_err(|_| "Could not save the Herdr launcher.")?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&path, fs::Permissions::from_mode(0o700))
            .map_err(|_| "Could not prepare the Herdr launcher permissions.")?;
    }
    let status = Command::new("/usr/bin/open")
        .args(["-a", "Terminal"])
        .arg(path)
        .status()
        .map_err(|_| "Could not open the system terminal.")?;
    status
        .success()
        .then_some(())
        .ok_or_else(|| "Open Herdr from your terminal, then return to setup.".into())
}

pub(super) fn run(app: &AppHandle, destination: &str) -> Result<(), String> {
    match destination {
        "herdr" => open_herdr(),
        "own" => {
            let ids = crate::sessions::collect_visible()
                .snapshot
                .agents
                .into_iter()
                .map(|a| a.id)
                .collect();
            let state = app.state::<Onboarding>();
            prepare_observation(app)?;
            state.store.update(|p| p.own_baseline = Some(ids))?;
            state.runtime().sample = super::model::Sample {
                phase: "own".into(),
                ..Default::default()
            };
            open_herdr()
        }
        "mayor" => crate::settings_window::open_internal(app, None, Some("assistant".into())),
        "town" => crate::town_process::open(app),
        "desktop" => crate::village_visibility::set(app, true).map(|_| ()),
        "applications" => Command::new("/usr/bin/open")
            .arg("/Applications")
            .status()
            .map_err(|_| "Could not open Applications.")?
            .success()
            .then_some(())
            .ok_or_else(|| "Open Applications in Finder.".into()),
        "installGuide" => open_url("https://herdr.dev/docs/install/"),
        "toolGuide" => {
            let tool = app
                .state::<Onboarding>()
                .store
                .get()
                .tool
                .ok_or("Choose a coding tool first.")?;
            let url = match tool.as_str() {
                "codex" => "https://developers.openai.com/codex/cli/",
                "claude" => "https://code.claude.com/docs/en/setup",
                "pi" => "https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent",
                "opencode" => "https://opencode.ai/docs/",
                "cursor" => "https://cursor.com/docs/cli/overview",
                "droid" => "https://docs.factory.ai/cli/getting-started/quickstart",
                _ => return Err("Choose a supported coding tool.".into()),
            };
            open_url(url)
        }
        _ => Err("Unknown setup destination.".into()),
    }
}
fn open_url(url: &str) -> Result<(), String> {
    Command::new("/usr/bin/open")
        .arg(url)
        .status()
        .map_err(|_| "Could not open the setup guide.")?
        .success()
        .then_some(())
        .ok_or_else(|| "The setup guide could not be opened.".into())
}

pub(super) fn prepare_observation(app: &AppHandle) -> Result<(), String> {
    if app
        .state::<crate::settings_window::SettingsSession>()
        .is_open()
    {
        return Err("Close Settings first so your desktop pet can appear, then retry.".into());
    }
    if app
        .state::<crate::town_process::TownWindowState>()
        .active
        .load(std::sync::atomic::Ordering::SeqCst)
    {
        return Err("Return from 3D Town to this setup window before running the test.".into());
    }
    crate::village_visibility::set(app, true).map(|_| ())
}
