use serde_json::{json, Value};
use std::io::{self, BufRead, BufReader, BufWriter, Write};
use std::sync::mpsc;
use std::time::Duration;

const PROTOCOL_VERSION: u64 = 1;
const MAX_COMMAND_BYTES: usize = 16 * 1024;
const SNAPSHOT_INTERVAL: Duration = Duration::from_millis(500);

enum Command {
    Active(bool),
    Focus { id: String },
    Shutdown,
    InputClosed,
}

pub(crate) fn run() {
    let (sender, receiver) = mpsc::channel();
    std::thread::spawn(move || read_commands(sender));
    let stdout = io::stdout();
    let mut output = BufWriter::new(stdout.lock());

    if write_snapshot(&mut output).is_err() {
        return;
    }
    loop {
        match receiver.recv_timeout(SNAPSHOT_INTERVAL) {
            Ok(Command::Active(active)) => signal_town_state(active),
            Ok(Command::Focus { id }) => {
                let result = crate::focus::focus_current_agent(&id);
                let response = json!({
                    "v": PROTOCOL_VERSION,
                    "type": "focusResult",
                    "id": id,
                    "ok": result.is_ok(),
                    "message": result.err(),
                });
                if write_message(&mut output, &response).is_err() {
                    signal_town_state(false);
                    return;
                }
            }
            Ok(Command::Shutdown | Command::InputClosed) => {
                signal_town_state(false);
                return;
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {
                if write_snapshot(&mut output).is_err() {
                    signal_town_state(false);
                    return;
                }
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => {
                signal_town_state(false);
                return;
            }
        }
    }
}

fn read_commands(sender: mpsc::Sender<Command>) {
    let stdin = io::stdin();
    let mut reader = BufReader::new(stdin.lock());
    loop {
        let mut line = String::new();
        let Ok(read) = reader.read_line(&mut line) else {
            let _ = sender.send(Command::InputClosed);
            return;
        };
        if read == 0 {
            let _ = sender.send(Command::InputClosed);
            return;
        }
        if read > MAX_COMMAND_BYTES {
            let _ = sender.send(Command::InputClosed);
            return;
        }
        let Some(command) = parse_command(&line) else {
            continue;
        };
        let stop = matches!(command, Command::Shutdown);
        if sender.send(command).is_err() || stop {
            return;
        }
    }
}

fn parse_command(line: &str) -> Option<Command> {
    let value: Value = serde_json::from_str(line).ok()?;
    if value.get("v")?.as_u64()? != PROTOCOL_VERSION {
        return None;
    }
    match value.get("type")?.as_str()? {
        "activeChanged" => Some(Command::Active(value.get("active")?.as_bool()?)),
        "focusAgent" => {
            let id = value.get("id")?.as_str()?.trim();
            (!id.is_empty() && id.len() <= 256).then(|| Command::Focus { id: id.to_string() })
        }
        "shutdown" => Some(Command::Shutdown),
        _ => None,
    }
}

fn write_snapshot(output: &mut impl Write) -> io::Result<()> {
    let collected = pet_town_agent_broker::collect();
    let mayor = read_mayor_state();
    write_message(
        output,
        &json!({
            "v": PROTOCOL_VERSION,
            "type": "snapshot",
            "available": collected.snapshot.available,
            "agents": collected.snapshot.agents,
            "mayor": mayor,
        }),
    )
}

fn read_mayor_state() -> Option<Value> {
    let path = crate::preferences_io::preferences_path()
        .ok()?
        .with_file_name("mayor-state.json");
    let value: Value = serde_json::from_slice(&std::fs::read(path).ok()?).ok()?;
    let pid = value.get("ownerPid")?.as_i64()?;
    if pid <= 0 || pid > i64::from(i32::MAX) {
        return None;
    }
    #[cfg(unix)]
    if unsafe { libc::kill(pid as i32, 0) } != 0 {
        return None;
    }
    Some(value)
}

fn write_message(output: &mut impl Write, value: &Value) -> io::Result<()> {
    serde_json::to_writer(&mut *output, value).map_err(io::Error::other)?;
    output.write_all(b"\n")?;
    output.flush()
}

#[cfg(unix)]
fn signal_town_state(active: bool) {
    let signal = if active { libc::SIGURG } else { libc::SIGWINCH };
    let _ = crate::app_singleton::signal_owner(signal);
}

#[cfg(not(unix))]
fn signal_town_state(_active: bool) {}
