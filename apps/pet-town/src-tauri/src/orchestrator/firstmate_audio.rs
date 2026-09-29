//! Play generated Mayor speech outside the hidden WebView.
use base64::Engine;
use std::{
    fs::{self, OpenOptions},
    io::Write,
    os::unix::fs::OpenOptionsExt,
    process::{Child, Command},
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Mutex,
    },
    time::Duration,
};
use tauri::{AppHandle, Manager};

#[derive(Default)]
pub struct FirstmateAudioState(pub Mutex<Option<Child>>, pub AtomicBool);

static NEXT_AUDIO: AtomicU64 = AtomicU64::new(0);

#[tauri::command]
pub async fn play_firstmate_audio(audio: String, app: AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || play(audio, app))
        .await
        .map_err(|_| "Could not play Mayor's voice.".to_string())?
}

fn play(audio: String, app: AppHandle) -> Result<(), String> {
    if audio.len() > 17_000_000 {
        return Err("Spoken reply is too large.".into());
    }
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(audio)
        .map_err(|_| "Spoken reply audio is invalid.".to_string())?;
    if bytes.is_empty() || bytes.len() > 12_000_000 {
        return Err("Spoken reply audio is empty or too large.".into());
    }
    let path = std::env::temp_dir().join(format!(
        "pet-town-mayor-{}-{}.mp3",
        std::process::id(),
        NEXT_AUDIO.fetch_add(1, Ordering::Relaxed)
    ));
    let result = play_file(&bytes, &path, &app);
    let _ = fs::remove_file(path);
    result
}

fn play_file(bytes: &[u8], path: &std::path::Path, app: &AppHandle) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .mode(0o600)
        .open(path)
        .map_err(|_| "Could not prepare spoken reply.".to_string())?;
    file.write_all(bytes)
        .map_err(|_| "Could not prepare spoken reply.".to_string())?;
    drop(file);
    let state = app.state::<FirstmateAudioState>();
    state.1.store(false, Ordering::SeqCst);
    let child = Command::new("/usr/bin/afplay")
        .arg(path)
        .spawn()
        .map_err(|_| "Could not start Mayor's voice.".to_string())?;
    *state.0.lock().unwrap_or_else(|error| error.into_inner()) = Some(child);
    loop {
        let done = {
            let mut current = state.0.lock().unwrap_or_else(|error| error.into_inner());
            current
                .as_mut()
                .ok_or_else(|| "Mayor playback stopped.".to_string())?
                .try_wait()
                .map_err(|_| "Could not check Mayor playback.".to_string())?
        };
        if let Some(status) = done {
            *state.0.lock().unwrap_or_else(|error| error.into_inner()) = None;
            return if status.success() || state.1.load(Ordering::SeqCst) {
                Ok(())
            } else {
                Err("Could not play Mayor's voice.".into())
            };
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}

#[tauri::command]
pub fn stop_firstmate_audio(app: AppHandle) {
    let state = app.state::<FirstmateAudioState>();
    state.1.store(true, Ordering::SeqCst);
    let mut current = state.0.lock().unwrap_or_else(|error| error.into_inner());
    if let Some(child) = current.as_mut() {
        let _ = child.kill();
    }
}
