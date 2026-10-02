//! Launch and persist a new isolated primary, cleaning its tab up on failure.
use super::{configured, persist, FirstmateSession, FirstmateState};
use serde_json::Value;
use std::{
    fs,
    path::{Path, PathBuf},
    time::Duration,
};
use tauri::{AppHandle, Manager};

fn field<'a>(value: &'a Value, keys: &[&str]) -> Result<&'a str, String> {
    keys.iter()
        .try_fold(value, |item, key| item.get(*key))
        .and_then(Value::as_str)
        .ok_or_else(|| "Herdr omitted the Firstmate session identifier.".into())
}

/// Called with the session startup lock held, including persistence and publication.
pub(super) fn launch(
    app: &AppHandle,
    settings: crate::preferences_model::OrchestratorPreferences,
    folder: &Path,
    home: &Path,
) -> Result<(String, String, PathBuf), String> {
    let workspace = super::super::herdr::workspace_for_folder(
        folder.to_str().ok_or("Invalid Firstmate folder path.")?,
    )?;
    let args = vec![
        "tab".into(),
        "create".into(),
        "--workspace".into(),
        workspace,
        "--cwd".into(),
        folder.to_string_lossy().into_owned(),
        "--label".into(),
        "Firstmate mayor".into(),
        "--no-focus".into(),
        "--env".into(),
        "OPENAI_API_KEY=".into(),
        "--env".into(),
        format!("FM_HOME={}", home.display()),
    ];
    let created = super::super::herdr::command(&args, Duration::from_secs(10))?;
    let tab = field(&created, &["result", "tab", "tab_id"])?.to_string();
    let pane = field(&created, &["result", "root_pane", "pane_id"])?.to_string();
    let name = format!(
        "pv_firstmate_{}",
        &uuid::Uuid::new_v4().simple().to_string()[..10]
    );
    let start = (|| {
        // A fresh tab can need a moment to reach its interactive shell.
        let deadline = std::time::Instant::now() + Duration::from_secs(30);
        loop {
            let info = super::super::herdr::command(
                &[
                    "pane".into(),
                    "process-info".into(),
                    "--pane".into(),
                    pane.clone(),
                ],
                Duration::from_secs(5),
            )?;
            let process = &info["result"]["process_info"];
            let shell = process["shell_pid"].as_u64();
            if process["foreground_processes"]
                .as_array()
                .is_some_and(|items| {
                    items.len() == 1 && items[0]["pid"].as_u64() == shell && shell.is_some()
                })
            {
                break;
            }
            if std::time::Instant::now() >= deadline {
                return Err("Firstmate pane did not become ready.".to_string());
            }
            std::thread::sleep(Duration::from_millis(200));
        }
        let started = super::super::herdr::command(
            &[
                "agent".into(),
                "start".into(),
                name.clone(),
                "--kind".into(),
                "pi".into(),
                "--pane".into(),
                pane.clone(),
                "--timeout".into(),
                "120000".into(),
                "--".into(),
                "--approve".into(),
                "--provider".into(),
                "openai-codex".into(),
                "--model".into(),
                settings.model.clone(),
                "--thinking".into(),
                settings.thinking.clone(),
            ],
            Duration::from_secs(125),
        )?;
        let log =
            field(&started, &["result", "agent", "agent_session", "value"]).map(PathBuf::from)?;
        // Pi may announce its session path before writing the first JSONL entry.
        // Do not require the file until the first prompt has produced output.
        if !log.is_absolute() || log.extension().is_none_or(|ext| ext != "jsonl") {
            return Err("Firstmate did not return a Pi session path.".into());
        }
        Ok(log)
    })();
    let log = match start {
        Ok(log) => log,
        Err(error) => {
            let _ = super::super::herdr::command(
                &["tab".into(), "close".into(), tab],
                Duration::from_secs(5),
            );
            return Err(error);
        }
    };
    if !configured(app).is_ok_and(|current| {
        current.firstmate_path == settings.firstmate_path
            && current.model == settings.model
            && current.thinking == settings.thinking
    }) {
        let _ = super::super::herdr::command(
            &["tab".into(), "close".into(), tab],
            Duration::from_secs(5),
        );
        return Err("Mayor settings changed while Firstmate was starting.".into());
    }
    let new_session = FirstmateSession {
        path: folder.to_string_lossy().into_owned(),
        tab: tab.clone(),
        pane: pane.clone(),
        agent: name.clone(),
        log: log.clone(),
        offset: fs::metadata(&log).map(|m| m.len()).unwrap_or(0),
        session_token: uuid::Uuid::new_v4().to_string(),
        model: settings.model,
        thinking: settings.thinking,
        home: home.to_string_lossy().into_owned(),
    };
    if let Err(error) = persist(&new_session) {
        let _ = super::super::herdr::command(
            &["tab".into(), "close".into(), tab],
            Duration::from_secs(5),
        );
        return Err(error);
    }
    *app.state::<FirstmateState>()
        .0
        .lock()
        .unwrap_or_else(|e| e.into_inner()) = new_session;
    Ok((name, pane, log))
}
