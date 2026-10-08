use base64::Engine;
use std::{
    ffi::CStr,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Mutex,
    },
    time::{Duration, Instant},
};
use tauri::{AppHandle, Manager};

static RECORDING: AtomicBool = AtomicBool::new(false);
static GENERATION: AtomicU64 = AtomicU64::new(0);
static STARTED_AT: Mutex<Option<Instant>> = Mutex::new(None);

#[cfg(target_os = "macos")]
unsafe extern "C" {
    fn pv_firstmate_record_start() -> bool;
    fn pv_firstmate_record_stop() -> *mut libc::c_char;
}

fn status(app: &AppHandle, message: &str) {
    super::status_commands::set_mayor_voice_status(message.to_string(), app.clone());
}

pub fn set(active: bool, app: AppHandle) -> Result<(), String> {
    if active {
        if RECORDING.load(Ordering::SeqCst) {
            return Ok(());
        }
        if super::firstmate::begin_listening(&app).is_err() {
            return Ok(());
        }
        RECORDING.store(true, Ordering::SeqCst);
        let result = start(&app);
        if result.is_err() {
            RECORDING.store(false, Ordering::SeqCst);
            super::firstmate::set_phase(&app, super::firstmate::READY);
        } else {
            *STARTED_AT.lock().unwrap_or_else(|error| error.into_inner()) = Some(Instant::now());
            let generation = GENERATION.fetch_add(1, Ordering::SeqCst) + 1;
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_secs(30));
                if GENERATION.load(Ordering::SeqCst) == generation {
                    let _ = set(false, app);
                }
            });
        }
        result
    } else {
        if !RECORDING.swap(false, Ordering::SeqCst) {
            return Ok(());
        }
        GENERATION.fetch_add(1, Ordering::SeqCst);
        super::firstmate::set_phase(&app, super::firstmate::WORKING);
        super::task_cancel::set_orchestrator_listening(false, app.clone());
        let path = stop().inspect_err(|_| {
            super::firstmate::set_phase(&app, super::firstmate::READY);
        })?;
        let started = STARTED_AT
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .take();
        if started.is_some_and(|instant| instant.elapsed() < Duration::from_millis(500)) {
            let _ = std::fs::remove_file(path);
            super::firstmate::set_phase(&app, super::firstmate::READY);
            status(&app, "Ready · hold to talk");
            return Ok(());
        }
        status(&app, "Transcribing…");
        tauri::async_runtime::spawn(async move {
            let result = submit(path, app.clone()).await;
            if let Err(error) = result {
                super::firstmate::set_phase(&app, super::firstmate::READY);
                status(&app, &error);
            }
        });
        Ok(())
    }
}

fn start(app: &AppHandle) -> Result<(), String> {
    if !app
        .state::<super::firstmate::FirstmateState>()
        .3
        .load(Ordering::SeqCst)
    {
        return Err("Firstmate is still starting. Try again in a moment.".into());
    }
    #[cfg(target_os = "macos")]
    if !unsafe { pv_firstmate_record_start() } {
        return Err("Could not start the microphone. Check Pet Town microphone access.".into());
    }
    super::task_cancel::set_orchestrator_listening(true, app.clone());
    status(app, "Listening");
    Ok(())
}

fn stop() -> Result<PathBuf, String> {
    #[cfg(target_os = "macos")]
    unsafe {
        let pointer = pv_firstmate_record_stop();
        if pointer.is_null() {
            return Err("Could not stop the microphone recording.".into());
        }
        let path = CStr::from_ptr(pointer).to_string_lossy().into_owned();
        libc::free(pointer.cast());
        Ok(PathBuf::from(path))
    }
    #[cfg(not(target_os = "macos"))]
    Err("Native town recording is available on macOS only.".into())
}

async fn submit(path: PathBuf, app: AppHandle) -> Result<(), String> {
    let bytes = std::fs::read(&path).map_err(|_| "Could not read microphone recording.")?;
    let _ = std::fs::remove_file(&path);
    if bytes.is_empty() {
        return Err("Recording is empty. Try again.".into());
    }
    let audio = base64::engine::general_purpose::STANDARD.encode(bytes);
    let text = super::firstmate::transcribe_firstmate_audio(audio, "audio/mp4".into(), app.clone())
        .await?;
    status(&app, "Firstmate is working…");
    super::firstmate::send_firstmate_text(text, app).await
}
