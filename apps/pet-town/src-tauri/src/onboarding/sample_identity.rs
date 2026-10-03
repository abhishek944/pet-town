use super::{
    model::{ProcessIdentity, SampleOwner},
    process,
};
use std::time::Duration;

fn birth(pid: u32) -> Result<String, String> {
    let args = vec!["-p".into(), pid.to_string(), "-o".into(), "lstart=".into()];
    crate::herdr_command::run_herdr_command_with_timeout(
        &"/bin/ps".into(),
        None,
        &args,
        Duration::from_secs(5),
    )
    .map(|v| v.trim().to_string())
    .filter(|v| !v.is_empty())
    .ok_or_else(|| "The sample process identity could not be confirmed. No action was sent.".into())
}
fn foreground(owner: &SampleOwner) -> Result<Vec<u32>, String> {
    let pane = owner
        .pane
        .as_deref()
        .ok_or("The sample pane is unavailable.")?;
    let value = process::owned(owner, &["pane", "process-info", "--pane", pane], 5)?;
    let info = &value["result"]["process_info"];
    let shell = info["shell_pid"].as_u64();
    let values = info["foreground_processes"]
        .as_array()
        .ok_or("The sample process list is unavailable.")?;
    let mut ids: Vec<_> = values
        .iter()
        .filter_map(|p| p["pid"].as_u64())
        .filter(|pid| Some(*pid) != shell && *pid > 0 && *pid <= u32::MAX as u64)
        .map(|pid| pid as u32)
        .collect();
    ids.sort_unstable();
    Ok(ids)
}
pub(super) fn capture(owner: &SampleOwner) -> Result<ProcessIdentity, String> {
    let pid = foreground(owner)?
        .into_iter()
        .next()
        .ok_or("The sample agent process is unavailable. Check Herdr before retrying.")?;
    Ok(ProcessIdentity {
        pid,
        started: birth(pid)?,
    })
}
pub(super) fn verify(owner: &SampleOwner) -> Result<(), String> {
    let saved = owner.process.as_ref().ok_or("The earlier launch outcome is uncertain. Check or close the sample in Herdr; setup will not launch or send another hello.")?;
    if !foreground(owner)?.contains(&saved.pid) || birth(saved.pid)? != saved.started {
        return Err("The sample process was replaced or exited. Manage it in Herdr; setup will not send input or stop another agent.".into());
    }
    Ok(())
}
