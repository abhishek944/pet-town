use super::{events, session::Session, TerminalEvent};
use std::io::{BufRead, BufReader, Read};
use std::process::{ChildStderr, ChildStdout};
use std::sync::{atomic::Ordering, Arc};
use std::time::Duration;

pub(super) fn start(session: Arc<Session>, stdout: ChildStdout, stderr: ChildStderr) {
    let diagnostics = std::thread::spawn(move || {
        let mut text = String::new();
        let _ = stderr.take(16_384).read_to_string(&mut text);
        text
    });
    let reader_session = session.clone();
    std::thread::spawn(move || {
        let mut reader = BufReader::new(stdout);
        let mut last_seq = None;
        loop {
            let mut line = Vec::new();
            let result = reader.by_ref().take(1_500_000).read_until(b'\n', &mut line);
            if reader_session.cancelled.load(Ordering::SeqCst) {
                break;
            }
            match result {
                Ok(0) | Err(_) => break,
                Ok(_) if line.last() != Some(&b'\n') => {
                    reader_session
                        .finish("disconnected", "Terminal frame exceeded the view limit.");
                    break;
                }
                _ => {}
            }
            let Ok(value) = serde_json::from_slice::<serde_json::Value>(&line) else {
                reader_session.finish(
                    "disconnected",
                    "Herdr returned an unreadable terminal frame.",
                );
                break;
            };
            if value["type"] == "terminal.closed" {
                let (state, message) = events::closed_state(value["reason"].as_str().unwrap_or(""));
                reader_session.finish(state, message);
                break;
            }
            let Some(frame) = events::frame(&value) else {
                reader_session.finish(
                    "disconnected",
                    "Herdr returned an unsupported terminal frame.",
                );
                break;
            };
            let TerminalEvent::Frame { seq, full, .. } = &frame else {
                unreachable!()
            };
            if last_seq.is_none() && !full || last_seq.is_some_and(|last| *seq <= last) {
                reader_session.finish(
                    "disconnected",
                    "Terminal frame order changed. Reconnect before typing.",
                );
                break;
            }
            last_seq = Some(*seq);
            if !reader_session.ready.swap(true, Ordering::SeqCst) {
                events::status(
                    &reader_session.channel,
                    "ready",
                    reader_session.control,
                    if reader_session.control {
                        "Terminal input is on"
                    } else {
                        "Watching the same terminal"
                    },
                );
            }
            if reader_session.channel.send(frame).is_err() {
                reader_session.stop();
                break;
            }
        }
        // Kill the CLI if necessary so its diagnostic reader cannot wait indefinitely.
        let natural_end = !reader_session.cancelled.load(Ordering::SeqCst);
        reader_session.stop();
        let error = diagnostics.join().unwrap_or_default();
        if natural_end && !error.is_empty() {
            let (state, message) = events::closed_state(&error);
            events::status(&reader_session.channel, state, false, message);
        } else if natural_end {
            events::status(&reader_session.channel, "disconnected", false,
                "The terminal connection ended. Reconnect to view it; check Herdr before retrying input.");
        }
    });
    std::thread::spawn(move || {
        let started = std::time::Instant::now();
        while !session.cancelled.load(Ordering::SeqCst) {
            std::thread::sleep(Duration::from_secs(1));
            if session.cancelled.load(Ordering::SeqCst) {
                break;
            }
            if !session.ready.load(Ordering::SeqCst) && started.elapsed() > Duration::from_secs(10)
            {
                session.finish(
                    "disconnected",
                    "Herdr did not produce an initial terminal frame. Reconnect to try again.",
                );
                break;
            }
            if let Err(error) = session.target.verify() {
                session.finish("stale", &error);
                break;
            }
        }
    });
}
