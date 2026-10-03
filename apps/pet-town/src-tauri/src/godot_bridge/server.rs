use serde_json::{json, Value};
use std::{
    io::{BufRead, BufReader, Read, Write},
    net::{TcpListener, TcpStream},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::Duration,
};
use tauri::{AppHandle, Manager};

pub(super) fn start(app: AppHandle, listener: TcpListener, token: String, cancel: Arc<AtomicBool>) {
    std::thread::spawn(move || {
        let _ = listener.set_nonblocking(true);
        while !cancel.load(Ordering::SeqCst) {
            match listener.accept() {
                Ok((stream, address)) if address.ip().is_loopback() => {
                    serve(&app, stream, &token, &cancel);
                    if !cancel.load(Ordering::SeqCst) {
                        super::set_focused(&app, false);
                        super::terminal::release(&app);
                    }
                }
                _ => std::thread::sleep(Duration::from_millis(50)),
            }
        }
    });
}

fn serve(app: &AppHandle, mut stream: TcpStream, token: &str, cancel: &AtomicBool) {
    // BSD/macOS accept inherits the listener's nonblocking socket mode.
    if stream.set_nonblocking(false).is_err() {
        return;
    }
    let _ = stream.set_read_timeout(Some(Duration::from_secs(15)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));
    let Ok(reader) = stream.try_clone() else {
        return;
    };
    let mut reader = BufReader::new(reader);
    let events = super::terminal::queue();
    loop {
        if cancel.load(Ordering::SeqCst) {
            break;
        }
        let mut line = Vec::new();
        if !matches!(reader.by_ref().take(131_072).read_until(b'\n', &mut line), Ok(n) if n > 0)
            || line.last() != Some(&b'\n')
        {
            break;
        }
        if cancel.load(Ordering::SeqCst) {
            break;
        }
        let Ok(request) = serde_json::from_slice::<Value>(&line) else {
            break;
        };
        if request["token"].as_str() != Some(token) {
            break;
        }
        // Initial companion model construction may block the authenticated render loop.
        let _ = reader
            .get_ref()
            .set_read_timeout(Some(Duration::from_secs(15)));
        let result = handle(app, &request, &events);
        let response = match result {
            Ok(value) => json!({"request":request["request"], "ok":true,"result":value}),
            Err(error) => json!({"request":request["request"],"ok":false,"error":error}),
        };
        let Ok(mut bytes) = serde_json::to_vec(&response) else {
            break;
        };
        bytes.push(b'\n');
        if stream.write_all(&bytes).is_err() {
            break;
        }
    }
}

fn handle(
    app: &AppHandle,
    request: &Value,
    events: &super::terminal::Queue,
) -> Result<Value, String> {
    match request["type"].as_str().unwrap_or("") {
        "poll" => {
            super::set_focused(app, request["focused"].as_bool().unwrap_or(false));
            let mut snapshot = crate::town_snapshot::snapshot(app);
            snapshot["terminalEvents"] = super::terminal::drain(events);
            super::updates::snapshot(app, &mut snapshot);
            snapshot["windowSerial"] = Value::from(
                app.state::<super::GodotState>()
                    .window_serial
                    .load(Ordering::SeqCst),
            );
            Ok(snapshot)
        }
        "action" => {
            if !super::focused(app) {
                return Err("Focus the town before using companion actions.".into());
            }
            tauri::async_runtime::block_on(crate::town_commands::dispatch(
                app.clone(),
                request["action"].as_str().unwrap_or("").into(),
                request["active"].as_bool(),
                request["mode"].as_str().map(str::to_owned),
                request["id"].as_str().map(str::to_owned),
            ))?;
            Ok(Value::Null)
        }
        "update.action" => {
            super::updates::action(app, request)?;
            Ok(Value::Null)
        }
        "update.prepare" => {
            super::updates::respond(app, request)?;
            Ok(Value::Null)
        }
        "terminal.open" => super::terminal::open(app, request, events.clone()),
        "terminal.send" => {
            super::terminal::send(app, request)?;
            Ok(Value::Null)
        }
        "terminal.close" => {
            super::terminal::release(app);
            Ok(Value::Null)
        }
        _ => Err("Unsupported native town request.".into()),
    }
}
