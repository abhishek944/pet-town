use serde_json::{json, Value};
use std::sync::atomic::{AtomicU64, Ordering};

static REQUEST: AtomicU64 = AtomicU64::new(1);

/// Only the fixed viewport-reset request is available; paths/targets stay native.
#[cfg(unix)]
pub(crate) fn live(socket: &str, pane: &str) -> Result<(), String> {
    let mut stream = crate::terminal_socket::connect(socket)
        .map_err(|_| "Herdr's terminal view API is unavailable. Open in Herdr to continue.")?;
    let id = format!(
        "pet-town-terminal-{}-{}",
        std::process::id(),
        REQUEST.fetch_add(1, Ordering::SeqCst)
    );
    let mut request = serde_json::to_vec(&json!({
        "id":id,"method":"pane.scroll","params":{"pane_id":pane,"offset_from_bottom":0}
    }))
    .map_err(|_| "Could not prepare the terminal view request.")?;
    request.push(b'\n');
    let response = exchange(&mut stream, &request)
        .map_err(|_| "Terminal view delivery is uncertain. Check Herdr before retrying.")?;
    if response.last() != Some(&b'\n') {
        return Err("Herdr returned an incomplete terminal view response.".into());
    }
    let value: Value = serde_json::from_slice(&response)
        .map_err(|_| "Herdr returned an invalid terminal view response.")?;
    if value["id"].as_str() != Some(id.as_str())
        || value["error"].is_object()
        || value["result"]["pane"]["pane_id"].as_str() != Some(pane)
        || value["result"]["pane"]["scroll"]["offset_from_bottom"].as_u64() != Some(0)
    {
        return Err("Herdr could not return this terminal view to live output.".into());
    }
    Ok(())
}

#[cfg(unix)]
fn exchange(
    stream: &mut std::os::unix::net::UnixStream,
    request: &[u8],
) -> std::io::Result<Vec<u8>> {
    use std::io::{Error, ErrorKind, Read, Write};
    use std::time::{Duration, Instant};
    stream.set_nonblocking(true)?;
    let deadline = Instant::now() + Duration::from_secs(2);
    let mut offset = 0;
    let mut response = Vec::new();
    let mut chunk = [0; 4096];
    loop {
        if Instant::now() >= deadline {
            return Err(Error::new(
                ErrorKind::TimedOut,
                "terminal view deadline exceeded",
            ));
        }
        let result = if offset < request.len() {
            stream.write(&request[offset..]).map(|count| {
                offset += count;
                count
            })
        } else {
            stream.read(&mut chunk).map(|count| {
                let end = chunk[..count]
                    .iter()
                    .position(|byte| *byte == b'\n')
                    .map_or(count, |index| index + 1);
                response.extend_from_slice(&chunk[..end]);
                count
            })
        };
        match result {
            Ok(0) => return Err(Error::new(ErrorKind::UnexpectedEof, "terminal view ended")),
            Ok(_) => {
                if response.len() > 1_048_576 {
                    return Err(Error::new(
                        ErrorKind::InvalidData,
                        "terminal view limit exceeded",
                    ));
                }
                if response.last() == Some(&b'\n') {
                    return Ok(response);
                }
            }
            Err(error) if error.kind() == ErrorKind::Interrupted => continue,
            Err(error) if error.kind() == ErrorKind::WouldBlock => {
                std::thread::sleep(Duration::from_millis(5))
            }
            Err(error) => return Err(error),
        }
    }
}

#[cfg(not(unix))]
pub(crate) fn live(_socket: &str, _pane: &str) -> Result<(), String> {
    Err("Open in Herdr to return this terminal view to live output.".into())
}
