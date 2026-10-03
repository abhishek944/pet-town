use super::{
    model::{Sample, SampleOwner},
    process, Onboarding,
};
use std::path::PathBuf;

pub(super) fn directory(owner: &SampleOwner) -> Result<PathBuf, String> {
    uuid::Uuid::parse_str(&owner.token).map_err(|_| "Saved sample identity is invalid.")?;
    Ok(crate::preferences_io::preferences_path()?
        .with_file_name("onboarding-demo")
        .join(&owner.token))
}
pub(super) fn name(owner: &SampleOwner) -> String {
    format!("pet-town-sample-{}", owner.token)
}

pub(super) fn label(owner: &SampleOwner) -> String {
    format!("Pet Town sample {}", owner.token)
}

pub(super) fn owned_workspace(owner: &SampleOwner) -> Result<Option<String>, String> {
    let list = process::owned(owner, &["workspace", "list"], 5)?;
    let entries = list["result"]["workspaces"]
        .as_array()
        .ok_or("Herdr did not return its workspaces.")?;
    let found = entries
        .iter()
        .filter(|v| {
            v["label"].as_str().or_else(|| v["name"].as_str()) == Some(label(owner).as_str())
        })
        .collect::<Vec<_>>();
    if found.len() > 1 {
        return Err(
            "More than one sample workspace was found. Resolve it in Herdr before retrying.".into(),
        );
    }
    let Some(entry) = found.first() else {
        return Ok(None);
    };
    let id = entry["workspace_id"]
        .as_str()
        .ok_or("The sample workspace identity is unavailable.")?;
    if owner.workspace.as_deref().is_some_and(|saved| saved != id) {
        return Err("The sample workspace changed. No action was sent.".into());
    }
    let panes = process::owned(owner, &["pane", "list", "--workspace", id], 5)?;
    let panes = panes["result"]["panes"]
        .as_array()
        .ok_or("The sample pane list is unavailable.")?;
    let expected = directory(owner)?;
    if panes.len() != 1 || panes[0]["cwd"].as_str().map(PathBuf::from).as_ref() != Some(&expected) {
        return Err(
            "The sample workspace was changed. Keep using it in Herdr; Pet Town will not alter it."
                .into(),
        );
    }
    if owner
        .pane
        .as_deref()
        .is_some_and(|saved| panes[0]["pane_id"].as_str() != Some(saved))
    {
        return Err("The sample pane changed. No action was sent.".into());
    }
    Ok(Some(id.into()))
}

pub(super) fn start(state: &Onboarding, tool: &str) -> Result<(), String> {
    super::tools::spec(tool)?;
    if !super::tool_readiness::supports(tool) {
        return Err(
            "This installed Herdr cannot launch the selected tool. Update Herdr, then check again."
                .into(),
        );
    }
    if state.store.get().sample.is_none() {
        let (readiness, message) = super::tool_readiness::check(tool);
        if readiness != "ready" {
            return Err(message.into());
        }
    }
    if super::dependency::check().phase != "ready" {
        return Err("Open Herdr and check its readiness before running the sample.".into());
    }
    let mut owner = if let Some(owner) = state.store.get().sample {
        if owner.tool != tool {
            return Err("Stop your current sample before trying a different tool.".into());
        }
        owner
    } else {
        let owner = SampleOwner {
            token: uuid::Uuid::new_v4().to_string(),
            socket: Some(process::socket()?),
            workspace: None,
            tab: None,
            pane: None,
            session: None,
            tool: tool.into(),
            create_attempted: false,
            launch_attempted: false,
            prompt_attempted: false,
            arrival_seen: false,
            process: None,
        };
        state.store.update(|p| p.sample = Some(owner.clone()))?;
        owner
    };
    state.store.update(|p| p.own_baseline = None)?;
    state.runtime().sample = Sample {
        phase: "starting".into(),
        owned: true,
        ..Sample::default()
    };
    super::sample_launch::prepare(state, &mut owner)?;
    super::sample_launch::launch(state, &mut owner)?;
    state.runtime().sample = Sample {
        phase: "waiting".into(),
        owned: true,
        ..Sample::default()
    };
    Ok(())
}

pub(super) fn stop(state: &Onboarding) -> Result<(), String> {
    let owner = state
        .store
        .get()
        .sample
        .ok_or("There is no sample owned by Pet Town.")?;
    if let Some(workspace) = owned_workspace(&owner)? {
        if owner.launch_attempted {
            super::sample_identity::verify(&owner)?;
            let value = process::owned(&owner, &["agent", "get", &name(&owner)], 5)?;
            let agent = &value["result"]["agent"];
            if agent["pane_id"].as_str() != owner.pane.as_deref()
                || agent["workspace_id"].as_str() != Some(&workspace)
            {
                return Err("A different agent now owns this pane. It will not be stopped.".into());
            }
            let session = agent["agent_session"]["value"]
                .as_str()
                .map(str::to_string)
                .unwrap_or_else(|| format!("ephemeral:{}", owner.pane.as_deref().unwrap_or("")));
            if owner
                .session
                .as_ref()
                .is_some_and(|saved| saved != &session && !saved.starts_with("ephemeral:"))
            {
                return Err("The sample session changed. It will not be stopped.".into());
            }
        } else if let Some(pane) = &owner.pane {
            let value = process::owned(&owner, &["pane", "process-info", "--pane", pane], 5)?;
            let info = &value["result"]["process_info"];
            let shell = info["shell_pid"].as_u64().filter(|pid| *pid > 0);
            if shell.is_none()
                || !info["foreground_processes"]
                    .as_array()
                    .is_some_and(|p| p.len() == 1 && p[0]["pid"].as_u64() == shell)
            {
                return Err("The demo pane is now in use. Close it yourself in Herdr; it will not be stopped by setup.".into());
            }
        }
        process::owned(&owner, &["workspace", "close", &workspace], 10)?;
    } else if owner.create_attempted && owner.workspace.is_none() {
        return Err("The sample creation outcome is still uncertain. Check Herdr before retrying; no second sample will be created.".into());
    }
    state.store.update(|p| p.sample = None)?;
    // Keep any files the user/tool may have added. Remove only our empty demo folder.
    if let Ok(path) = directory(&owner) {
        let _ = std::fs::remove_dir(path);
    }
    state.runtime().sample = Sample {
        phase: if state.store.get().own_baseline.is_some() {
            "own"
        } else {
            "stopped"
        }
        .into(),
        ..Sample::default()
    };
    Ok(())
}
