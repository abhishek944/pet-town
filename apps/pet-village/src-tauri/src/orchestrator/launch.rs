use super::herdr;
use serde_json::Value;
use std::time::{Duration, Instant};

pub fn start_agent(
    pane_id: &str,
    agent_name: &str,
    model: &str,
    thinking: &str,
) -> Result<Value, String> {
    wait_for_shell(pane_id)?;
    let arguments = vec![
        "agent".into(),
        "start".into(),
        agent_name.into(),
        "--kind".into(),
        "pi".into(),
        "--pane".into(),
        pane_id.into(),
        "--timeout".into(),
        "120000".into(),
        "--".into(),
        "--no-session".into(),
        "--no-extensions".into(),
        "--approve".into(),
        "--provider".into(),
        "openai-codex".into(),
        "--model".into(),
        model.into(),
        "--thinking".into(),
        thinking.into(),
    ];
    let response = herdr::command(&arguments, Duration::from_secs(125))?;
    verify(&response, model, thinking)?;
    Ok(response)
}

fn wait_for_shell(pane_id: &str) -> Result<(), String> {
    let deadline = Instant::now() + Duration::from_secs(300);
    loop {
        let response = herdr::command(
            &[
                "pane".into(),
                "process-info".into(),
                "--pane".into(),
                pane_id.into(),
            ],
            Duration::from_secs(5),
        )?;
        if ready(&response) {
            return Ok(());
        }
        if Instant::now() >= deadline {
            return Err("The Herdr pane did not become ready for Pi.".into());
        }
        std::thread::sleep(Duration::from_millis(250));
    }
}

fn ready(value: &Value) -> bool {
    let result = value.get("result").unwrap_or(value);
    let info = result.get("process_info").unwrap_or(result);
    let Some(shell) = info.get("shell_pid").and_then(Value::as_u64) else {
        return false;
    };
    let Some(processes) = info.get("foreground_processes").and_then(Value::as_array) else {
        return false;
    };
    processes.len() == 1
        && processes[0].get("pid").and_then(Value::as_u64) == Some(shell)
        && shell > 0
}

fn verify(value: &Value, model: &str, thinking: &str) -> Result<(), String> {
    let argv = value["result"]["argv"]
        .as_array()
        .ok_or_else(|| "Herdr did not report the launched Pi arguments.".to_string())?;
    let args: Vec<&str> = argv.iter().filter_map(Value::as_str).collect();
    let has_pair = |flag: &str, expected: &str| {
        args.windows(2)
            .any(|pair| pair[0] == flag && pair[1] == expected)
    };
    if !args.contains(&"--no-session")
        || !args.contains(&"--no-extensions")
        || !args.contains(&"--approve")
        || !has_pair("--provider", "openai-codex")
        || !has_pair("--model", model)
        || !has_pair("--thinking", thinking)
    {
        return Err("Herdr launched Pi with unexpected model settings.".into());
    }
    Ok(())
}
