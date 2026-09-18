use super::generation_protocol::{self, WorkerResult};
use super::types::MODELS;
use super::worker_registry::WorkerGuard;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread::JoinHandle;
use std::time::Duration;
use wait_timeout::ChildExt;

const WORKER_TIMEOUT: Duration = Duration::from_secs(195);
const MAX_PROTOCOL_BYTES: usize = 1024 * 1024;
const MAX_REQUEST_BYTES: usize = 256 * 1024;

pub fn validate_request(
    model: &str,
    quality: &str,
    prompt: &str,
    maximum_prompt: usize,
) -> Result<(), String> {
    if !MODELS.contains(&model) {
        return Err("Choose one of the supported GPT Image 2.5 models.".into());
    }
    if !["low", "medium", "high", "xhigh", "max"].contains(&quality) {
        return Err("Choose a supported image quality.".into());
    }
    if prompt.trim().is_empty() || prompt.chars().count() > maximum_prompt {
        return Err(format!(
            "Enter an image prompt of at most {maximum_prompt} characters."
        ));
    }
    Ok(())
}

fn worker_command() -> Result<(PathBuf, PathBuf), String> {
    if let Some(root) = crate::orchestrator::runtime::directory()? {
        return Ok((
            root.join("node"),
            root.join("package/pet-studio-image-worker.mjs"),
        ));
    }
    if cfg!(debug_assertions) {
        let worker =
            Path::new(env!("CARGO_MANIFEST_DIR")).join("../scripts/pet-studio-image-worker.mjs");
        return Ok((PathBuf::from("node"), worker));
    }
    Err("The bundled image-generation runtime is unavailable.".into())
}

fn bounded_read(reader: &mut impl Read) -> Result<Vec<u8>, String> {
    let mut output = Vec::new();
    reader
        .take((MAX_PROTOCOL_BYTES + 1) as u64)
        .read_to_end(&mut output)
        .map_err(|_| "Could not read the image worker response.".to_string())?;
    if output.len() > MAX_PROTOCOL_BYTES {
        return Err("The image worker returned too much data.".into());
    }
    Ok(output)
}

fn join_reader(handle: JoinHandle<Result<Vec<u8>, String>>) -> Result<Vec<u8>, String> {
    handle
        .join()
        .map_err(|_| "The image worker output reader stopped unexpectedly.".to_string())?
}

fn stop_child(child: &mut std::process::Child, guard: &mut WorkerGuard) {
    let _ = child.kill();
    let _ = child.wait();
    guard.finish();
}

pub fn execute(directory: &Path, request: serde_json::Value) -> Result<WorkerResult, String> {
    let key = crate::orchestrator::openai::api_key().ok_or_else(|| {
        "OpenAI API key not found in the environment or Pet Village Keychain entry.".to_string()
    })?;
    let encoded = serde_json::to_vec(&request)
        .map_err(|_| "Could not prepare the image-generation request.".to_string())?;
    if encoded.len() > MAX_REQUEST_BYTES {
        return Err("The image-generation request is too large.".into());
    }
    if super::worker_registry::cancelled() {
        return Err("Image generation was cancelled.".into());
    }
    let (node, worker) = worker_command()?;
    if !worker.is_file() {
        return Err("The image-generation worker is unavailable.".into());
    }
    let mut child = Command::new(node)
        .arg(worker)
        .current_dir(directory)
        .env_remove("NODE_OPTIONS")
        .env_remove("NODE_PATH")
        .env("OPENAI_API_KEY", key)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|_| "Could not start the image-generation worker.".to_string())?;
    let mut guard = WorkerGuard::register(child.id(), directory);
    if super::worker_registry::cancelled() {
        stop_child(&mut child, &mut guard);
        return Err("Image generation was cancelled.".into());
    }
    let sent = child
        .stdin
        .take()
        .ok_or_else(|| "Could not open the image worker input.".to_string())
        .and_then(|mut input| {
            input
                .write_all(&encoded)
                .map_err(|_| "Could not send the image-generation request.".to_string())
        });
    if let Err(error) = sent {
        stop_child(&mut child, &mut guard);
        return Err(error);
    }
    let (mut stdout, mut stderr) = match (child.stdout.take(), child.stderr.take()) {
        (Some(stdout), Some(stderr)) => (stdout, stderr),
        _ => {
            stop_child(&mut child, &mut guard);
            return Err("The image worker output is unavailable.".into());
        }
    };
    let stdout_reader = std::thread::spawn(move || bounded_read(&mut stdout));
    let stderr_reader = std::thread::spawn(move || bounded_read(&mut stderr));
    let status = match child.wait_timeout(WORKER_TIMEOUT) {
        Ok(Some(status)) => status,
        Ok(None) => {
            stop_child(&mut child, &mut guard);
            let _ = join_reader(stdout_reader);
            let _ = join_reader(stderr_reader);
            return Err("Image generation timed out. No automatic retry was made.".into());
        }
        Err(_) => {
            stop_child(&mut child, &mut guard);
            let _ = join_reader(stdout_reader);
            let _ = join_reader(stderr_reader);
            return Err("Could not wait for the image-generation worker.".into());
        }
    };
    guard.finish();
    let stdout = join_reader(stdout_reader)?;
    let _stderr = join_reader(stderr_reader)?;
    generation_protocol::parse(&stdout, status.success())
}
