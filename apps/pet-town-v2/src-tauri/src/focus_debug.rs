use std::fs;

const MAX_LINES: usize = 200;

fn now_ms() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|value| value.as_millis())
        .unwrap_or(0)
}

pub(crate) fn record(event: String) {
    let Ok(directory) = crate::storage::root() else {
        return;
    };
    let _ = fs::create_dir_all(&directory);
    let path = directory.join("focus-debug.log");
    let mut lines: Vec<String> = fs::read_to_string(&path)
        .unwrap_or_default()
        .lines()
        .map(str::to_string)
        .collect();
    lines.push(format!("{} {event}", now_ms()));
    if lines.len() > MAX_LINES {
        lines.drain(..lines.len() - MAX_LINES);
    }
    let _ = fs::write(path, lines.join("\n") + "\n");
}
