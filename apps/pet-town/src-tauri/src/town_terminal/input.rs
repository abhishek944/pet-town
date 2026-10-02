use serde::Deserialize;
use std::io::{self, Write};
use std::process::ChildStdin;
use std::time::{Duration, Instant};

#[derive(Deserialize)]
#[serde(tag = "type", deny_unknown_fields)]
pub(crate) enum TerminalCommand {
    #[serde(rename = "terminal.input")]
    Input { text: String },
    #[serde(rename = "terminal.resize")]
    Resize { cols: u16, rows: u16 },
    #[serde(rename = "terminal.scroll")]
    Scroll {
        direction: String,
        lines: u16,
        column: Option<u16>,
        row: Option<u16>,
        #[serde(default)]
        modifiers: u8,
    },
    #[serde(rename = "terminal.live")]
    Live {},
    #[serde(rename = "terminal.mouse")]
    Mouse {
        action: String,
        button: String,
        column: u16,
        row: u16,
        modifiers: u8,
    },
}

pub(super) fn dimensions(cols: u16, rows: u16) -> Result<(), String> {
    if !(2..=512).contains(&cols) || !(2..=256).contains(&rows) {
        return Err("Terminal dimensions are out of range.".into());
    }
    Ok(())
}

impl TerminalCommand {
    pub(super) fn payload(&self) -> Result<Vec<u8>, String> {
        use serde_json::json;
        let value = match self {
            Self::Input { text } if !text.is_empty() && text.len() <= 65_536 => {
                json!({"type":"terminal.input", "text":text})
            }
            Self::Resize { cols, rows } => {
                dimensions(*cols, *rows)?;
                json!({"type":"terminal.resize", "cols":cols, "rows":rows})
            }
            Self::Scroll {
                direction,
                lines,
                column,
                row,
                modifiers,
            } if matches!(direction.as_str(), "up" | "down")
                && *lines > 0
                && column.is_none_or(|value| value < 512)
                && row.is_none_or(|value| value < 256)
                && *modifiers <= 7 =>
            {
                json!({"type":"terminal.scroll", "direction":direction,"lines":lines,
                    "column":column,"row":row,"modifiers":modifiers})
            }
            Self::Live {} => json!({"type":"terminal.live"}),
            Self::Mouse {
                action,
                button,
                column,
                row,
                modifiers,
            } if matches!(action.as_str(), "down" | "up" | "drag" | "move")
                && matches!(button.as_str(), "left" | "right" | "middle")
                && *column < 512
                && *row < 256
                && *modifiers <= 7 =>
            {
                json!({"type":"terminal.mouse", "action":action,"button":button,
                    "column":column,"row":row,"modifiers":modifiers})
            }
            _ => return Err("Terminal input is invalid or too large.".into()),
        };
        let mut bytes =
            serde_json::to_vec(&value).map_err(|_| "Could not encode terminal input.")?;
        bytes.push(b'\n');
        Ok(bytes)
    }
}

pub(super) fn nonblocking(stdin: &ChildStdin) -> Result<(), String> {
    #[cfg(unix)]
    {
        use std::os::fd::AsRawFd;
        let fd = stdin.as_raw_fd();
        let flags = unsafe { libc::fcntl(fd, libc::F_GETFL) };
        if flags < 0 || unsafe { libc::fcntl(fd, libc::F_SETFL, flags | libc::O_NONBLOCK) } < 0 {
            return Err("Could not prepare bounded terminal input.".into());
        }
    }
    Ok(())
}

pub(super) fn write_bounded(stdin: &mut ChildStdin, payload: &[u8]) -> Result<(), String> {
    let deadline = Instant::now() + Duration::from_millis(500);
    let mut offset = 0;
    while offset < payload.len() {
        match stdin.write(&payload[offset..]) {
            Ok(0) => return Err("Terminal connection closed; delivery is uncertain.".into()),
            Ok(count) => offset += count,
            Err(error) if error.kind() == io::ErrorKind::Interrupted => continue,
            Err(error)
                if error.kind() == io::ErrorKind::WouldBlock && Instant::now() < deadline =>
            {
                std::thread::sleep(Duration::from_millis(5))
            }
            Err(_) => {
                return Err(
                    "Terminal input failed; delivery is uncertain. Check Herdr before retrying."
                        .into(),
                )
            }
        }
    }
    Ok(())
}
