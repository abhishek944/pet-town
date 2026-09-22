use super::herdr;
use std::time::Duration;

pub struct Pending;

pub fn submit(agent: &str, prompt: &str) -> Result<Pending, String> {
    herdr::command(
        &[
            "agent".into(),
            "prompt".into(),
            agent.into(),
            prompt.into(),
            "--wait".into(),
            "--until".into(),
            "working".into(),
            "--timeout".into(),
            "10000".into(),
        ],
        Duration::from_secs(15),
    )?;
    Ok(Pending)
}

pub fn collect(agent: &str, _pending: Pending) -> Result<String, String> {
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
    Ok(raw_tail(&value))
}

pub fn terminal_missing(error: &str) -> bool {
    let value = error.to_ascii_lowercase();
    value.contains("not found") || value.contains("unknown agent") || value.contains("unknown tab")
}

/// Keeps tool results bounded for the voice backend without rewriting them.
fn raw_tail(text: &str) -> String {
    const LIMIT: usize = 12_000;
    if text.len() <= LIMIT {
        return text.trim().to_string();
    }
    let mut start = text.len() - LIMIT;
    while start < text.len() && !text.is_char_boundary(start) {
        start += 1;
    }
    text[start..].trim().to_string()
}
