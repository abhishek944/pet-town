use serde::Deserialize;
use std::path::PathBuf;

#[derive(Deserialize)]
struct WorkerEnvelope {
    #[serde(rename = "type")]
    kind: String,
    message: Option<String>,
    result: Option<WorkerResult>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkerResult {
    pub operation: String,
    pub model: String,
    pub provider: String,
    pub path: Option<PathBuf>,
    pub run_directory: Option<PathBuf>,
    pub raw_sheet: Option<PathBuf>,
    pub normalized_sheet: Option<PathBuf>,
    pub frames: Option<Vec<WorkerFrame>>,
    pub validation: Option<WorkerValidation>,
}

#[derive(Deserialize)]
pub struct WorkerFrame {
    pub index: usize,
    pub path: PathBuf,
    pub width: u32,
    pub height: u32,
}

#[derive(Deserialize)]
pub struct WorkerValidation {
    pub accepted: bool,
    pub issues: Vec<WorkerIssue>,
}

#[derive(Deserialize)]
pub struct WorkerIssue {
    pub severity: String,
    pub message: String,
}

pub fn parse(stdout: &[u8], success: bool) -> Result<WorkerResult, String> {
    let mut result = None;
    let mut safe_error = None;
    for line in stdout
        .split(|byte| *byte == b'\n')
        .filter(|line| !line.is_empty())
    {
        let envelope: WorkerEnvelope = serde_json::from_slice(line)
            .map_err(|_| "The image worker returned an invalid response.".to_string())?;
        match envelope.kind.as_str() {
            "progress" => {}
            "result" => result = envelope.result,
            "error" => safe_error = envelope.message,
            _ => return Err("The image worker returned an invalid response.".into()),
        }
    }
    if success {
        result.ok_or_else(|| "The image worker returned no result.".into())
    } else {
        Err(safe_error
            .unwrap_or_else(|| "Image generation failed before producing a usable result.".into()))
    }
}
