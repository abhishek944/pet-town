use super::herdr;
use std::time::Duration;

pub struct Pending {
    begin: String,
    end: String,
}

pub fn submit(agent: &str, prompt: &str) -> Result<Pending, String> {
    let token = uuid::Uuid::new_v4().simple().to_string();
    let begin = format!("[[PV_BEGIN:{token}]]");
    let end = format!("[[PV_END:{token}]]");
    let bounded = format!("{prompt}\n\nReturn a concise voice handoff inside these exact boundary lines. Include verified status and the next useful step.\n{begin}\n{end}");
    herdr::command(
        &[
            "agent".into(),
            "prompt".into(),
            agent.into(),
            bounded,
            "--wait".into(),
            "--until".into(),
            "working".into(),
            "--timeout".into(),
            "10000".into(),
        ],
        Duration::from_secs(15),
    )?;
    Ok(Pending { begin, end })
}

pub fn collect(agent: &str, pending: Pending) -> Result<String, String> {
    let wait = [
        "agent".into(),
        "wait".into(),
        agent.into(),
        "--until".into(),
        "idle".into(),
        "--until".into(),
        "done".into(),
        "--until".into(),
        "blocked".into(),
        "--timeout".into(),
        "10800000".into(),
    ];
    loop {
        match herdr::command(&wait, Duration::from_secs(10_805)) {
            Ok(_) => break,
            Err(error) if terminal_missing(&error) => return Err(error),
            Err(_) => std::thread::sleep(Duration::from_secs(1)),
        }
    }
    let read = [
        "agent".into(),
        "read".into(),
        agent.into(),
        "--source".into(),
        "recent-unwrapped".into(),
        "--lines".into(),
        "320".into(),
        "--format".into(),
        "text".into(),
    ];
    let value = loop {
        match herdr::text(&read, Duration::from_secs(10)) {
            Ok(value) => break value,
            Err(error) if terminal_missing(&error) => return Err(error),
            Err(_) => std::thread::sleep(Duration::from_secs(1)),
        }
    };
    extract(&value, &pending.begin, &pending.end)
}

pub fn terminal_missing(error: &str) -> bool {
    let value = error.to_ascii_lowercase();
    value.contains("not found") || value.contains("unknown agent") || value.contains("unknown tab")
}

fn extract(text: &str, begin: &str, end: &str) -> Result<String, String> {
    let finish = text
        .rfind(end)
        .ok_or_else(|| "Pi response did not finish cleanly.".to_string())?;
    let start = text[..finish]
        .rfind(begin)
        .map(|index| index + begin.len())
        .ok_or_else(|| "Pi response could not be isolated safely.".to_string())?;
    let output = text[start..finish].trim();
    if output.is_empty() {
        return Err("Pi returned no verified handoff.".into());
    }
    Ok(output.to_string())
}
