use super::{model::SampleOwner, process, sample, Onboarding};
use std::{
    fs,
    time::{Duration, Instant},
};

fn save(state: &Onboarding, owner: &SampleOwner) -> Result<(), String> {
    state
        .store
        .update(|p| p.sample = Some(owner.clone()))
        .map(|_| ())
}
pub(super) fn prepare(state: &Onboarding, owner: &mut SampleOwner) -> Result<(), String> {
    let directory = sample::directory(owner)?;
    fs::create_dir_all(&directory).map_err(|_| "Could not prepare the temporary demo folder.")?;
    crate::preferences_permissions::restrict_directory(&directory)?;
    let workspace = match sample::owned_workspace(owner)? {
        Some(id) => id,
        None if owner.create_attempted => return Err("The previous sample creation is uncertain. Check Herdr before retrying. No second sample was created.".into()),
        None => {
            let launch_path = super::tools::launch_path(&owner.tool)?;
            let environment = format!("PATH={}", launch_path.to_string_lossy());
            owner.create_attempted = true; save(state, owner)?;
            let value = process::owned(owner, &["workspace", "create", "--cwd", &directory.to_string_lossy(), "--label", &sample::label(owner), "--no-focus", "--env", &environment], 15)?;
            process::string(&value, &["result", "workspace", "workspace_id"])?
        }
    };
    owner.workspace = Some(workspace.clone());
    save(state, owner)?;
    let panes = process::owned(owner, &["pane", "list", "--workspace", &workspace], 5)?;
    let panes = panes["result"]["panes"]
        .as_array()
        .ok_or("The demo pane was unavailable.")?;
    if panes.len() != 1 {
        return Err("The demo workspace has changed. No agent was started.".into());
    }
    let pane = &panes[0];
    if pane["cwd"].as_str().map(std::path::PathBuf::from).as_ref() != Some(&directory) {
        return Err("The demo pane is outside its temporary folder. No agent was started.".into());
    }
    owner.pane = Some(process::string(pane, &["pane_id"])?);
    owner.tab = Some(process::string(pane, &["tab_id"])?);
    save(state, owner)
}

fn shell_ready(owner: &SampleOwner, pane: &str) -> Result<(), String> {
    let deadline = Instant::now() + Duration::from_secs(20);
    loop {
        let value = process::owned(owner, &["pane", "process-info", "--pane", pane], 5)?;
        let info = &value["result"]["process_info"];
        let shell = info["shell_pid"].as_u64().filter(|pid| *pid > 0);
        if shell.is_some()
            && info["foreground_processes"]
                .as_array()
                .is_some_and(|p| p.len() == 1 && p[0]["pid"].as_u64() == shell)
        {
            return Ok(());
        }
        if Instant::now() >= deadline {
            return Err(
                "The demo shell is not ready. Open Herdr to finish any startup prompts.".into(),
            );
        }
        std::thread::sleep(Duration::from_millis(250));
    }
}

pub(super) fn launch(state: &Onboarding, owner: &mut SampleOwner) -> Result<(), String> {
    let pane = owner
        .pane
        .clone()
        .ok_or("The sample pane is unavailable.")?;
    if !owner.launch_attempted {
        shell_ready(owner, &pane)?;
        owner.launch_attempted = true;
        save(state, owner)?;
        let kind = if owner.tool == "cursor" {
            "cursor"
        } else {
            owner.tool.as_str()
        };
        let name = sample::name(owner);
        process::owned(
            owner,
            &[
                "agent",
                "start",
                &name,
                "--kind",
                kind,
                "--pane",
                &pane,
                "--timeout",
                "30000",
            ],
            35,
        )?;
        owner.process = Some(super::sample_identity::capture(owner)?);
        save(state, owner)?;
    }
    super::sample_identity::verify(owner)?;
    let current = process::owned(owner, &["agent", "get", &sample::name(owner)], 5)?;
    let agent = &current["result"]["agent"];
    if agent["workspace_id"].as_str() != owner.workspace.as_deref()
        || agent["pane_id"].as_str() != Some(&pane)
    {
        return Err("The sample agent moved. No prompt was sent.".into());
    }
    let session = agent["agent_session"]["value"]
        .as_str()
        .map(str::to_string)
        .unwrap_or_else(|| format!("ephemeral:{pane}"));
    if owner
        .session
        .as_ref()
        .is_some_and(|id| id != &session && !id.starts_with("ephemeral:"))
    {
        return Err("The sample was replaced by another agent. No prompt was sent.".into());
    }
    owner.session = Some(session);
    save(state, owner)?;
    if owner.prompt_attempted {
        return Ok(());
    }
    if agent["agent_status"] == "blocked" {
        return Err("The coding tool needs your input. Open its Herdr pane, finish sign-in or approval, then retry the test.".into());
    }
    if agent["agent_status"] == "working" {
        return Err("The sample is already working. Wait for it before retrying.".into());
    }
    if !matches!(agent["agent_status"].as_str(), Some("idle" | "done")) {
        return Err(
            "The sample is not ready for a prompt. Finish startup in Herdr, then retry.".into(),
        );
    }
    owner.prompt_attempted = true;
    save(state, owner)?;
    process::owned(owner, &["agent", "prompt", &sample::name(owner), "Say hello in one short sentence. Do not inspect or change any files, run commands, or create more agents."], 10)?;
    Ok(())
}
