//! Completed structured assistant text only; never terminal or tool output.
use super::{persist, FirstmateReply, FirstmateSession};
use serde_json::Value;
use std::{
    fs,
    io::{BufRead, BufReader, Read, Seek, SeekFrom},
};

pub(super) fn poll(session: &mut FirstmateSession) -> Result<Option<FirstmateReply>, String> {
    if session.log.as_os_str().is_empty() {
        return Ok(None);
    }
    let mut file = match fs::File::open(&session.log) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound && session.offset == 0 => {
            return Ok(None)
        }
        Err(_) => return Err("Firstmate session log unavailable.".into()),
    };
    let len = file
        .metadata()
        .map_err(|_| "Could not inspect Firstmate log.".to_string())?
        .len();
    if len < session.offset {
        session.offset = 0;
    }
    file.seek(SeekFrom::Start(session.offset))
        .map_err(|_| "Could not read Firstmate log.".to_string())?;
    let mut reader = BufReader::new(file);
    loop {
        let start = reader
            .stream_position()
            .map_err(|_| "Could not read Firstmate log.".to_string())?;
        let mut bytes = Vec::new();
        let read = (&mut reader)
            .take(256_001)
            .read_until(b'\n', &mut bytes)
            .map_err(|_| "Could not read Firstmate log.".to_string())?;
        if read == 0 {
            break;
        }
        if !bytes.ends_with(b"\n") {
            if read <= 256_000 {
                break;
            } // Incomplete record: retry after the writer finishes.
              // Skip oversized records without allocating their entire tool payload.
            loop {
                let mut chunk = Vec::new();
                let n = (&mut reader)
                    .take(8_192)
                    .read_until(b'\n', &mut chunk)
                    .map_err(|_| "Could not skip oversized Firstmate record.".to_string())?;
                if n == 0 || chunk.ends_with(b"\n") {
                    break;
                }
            }
            session.offset = reader.stream_position().unwrap_or(start);
            persist(session)?;
            continue;
        }
        let end = reader.stream_position().unwrap_or(start);
        let Ok(line) = std::str::from_utf8(&bytes) else {
            session.offset = end;
            persist(session)?;
            continue;
        };
        if let Ok(value) = serde_json::from_str::<Value>(line) {
            let message = &value["message"];
            if value["type"] == "message"
                && message["role"] == "assistant"
                && message["stopReason"] == "error"
            {
                session.offset = end;
                persist(session)?;
                return Err(
                    "Firstmate could not complete its reply. Check the agent and retry.".into(),
                );
            }
            if value["type"] == "message"
                && message["role"] == "assistant"
                && message["stopReason"] == "stop"
            {
                let text = message["content"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .filter(|part| part["type"] == "text")
                    .filter_map(|part| part["text"].as_str())
                    .collect::<Vec<_>>()
                    .join("\n");
                if !text.trim().is_empty() {
                    return Ok(Some(FirstmateReply {
                        text: text.trim().chars().take(6000).collect(),
                        offset: end,
                        session_token: session.session_token.clone(),
                    }));
                }
            }
        }
        session.offset = end;
        persist(session)?;
    }
    Ok(None)
}

pub(super) fn acknowledge(
    session: &mut FirstmateSession,
    offset: u64,
    token: &str,
) -> Result<(), String> {
    if token.is_empty() || token != session.session_token {
        return Err("Firstmate session changed before this reply could be acknowledged.".into());
    }
    let length = fs::metadata(&session.log)
        .map_err(|_| "Firstmate session log unavailable.".to_string())?
        .len();
    if offset < session.offset || offset > length {
        return Err("Firstmate reply changed before it could be acknowledged.".into());
    }
    session.offset = offset;
    persist(session)
}

pub(super) fn latest(session: &mut FirstmateSession) -> Result<Option<String>, String> {
    let log = &session.log;
    if log.as_os_str().is_empty() {
        return Ok(None);
    }
    let mut file = fs::File::open(log).map_err(|_| "Firstmate session log unavailable.")?;
    let length = file
        .metadata()
        .map_err(|_| "Could not inspect Firstmate log.")?
        .len();
    file.seek(SeekFrom::Start(length.saturating_sub(512_000)))
        .map_err(|_| "Could not read Firstmate log.")?;
    let mut bytes = Vec::new();
    file.take(512_000)
        .read_to_end(&mut bytes)
        .map_err(|_| "Could not read Firstmate log.")?;
    for line in bytes.split(|byte| *byte == b'\n').rev() {
        let Ok(value) = serde_json::from_slice::<Value>(line) else {
            continue;
        };
        let message = &value["message"];
        if value["type"] != "message"
            || message["role"] != "assistant"
            || message["stopReason"] != "stop"
        {
            continue;
        }
        let text = message["content"]
            .as_array()
            .into_iter()
            .flatten()
            .filter(|part| part["type"] == "text")
            .filter_map(|part| part["text"].as_str())
            .collect::<Vec<_>>()
            .join("\n");
        if !text.trim().is_empty() {
            return Ok(Some(text.trim().chars().take(6000).collect()));
        }
    }
    Ok(None)
}
