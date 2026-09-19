use std::ffi::{c_char, CStr, CString};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Mutex, OnceLock};
use tauri::{AppHandle, Emitter, Manager};

static APP: OnceLock<AppHandle> = OnceLock::new();
static TESTING: AtomicBool = AtomicBool::new(false);
static GENERATION: AtomicU64 = AtomicU64::new(0);
static PUBLICATION: Mutex<()> = Mutex::new(());

#[cfg(target_os = "macos")]
unsafe extern "C" {
    fn pv_wake_supported() -> bool;
    fn pv_wake_start(
        phrase: *const c_char,
        generation: u64,
        callback: extern "C" fn(bool, *const c_char, u64),
    );
    fn pv_wake_stop();
}

pub fn generation() -> u64 {
    GENERATION.load(Ordering::SeqCst)
}

pub fn supported() -> bool {
    #[cfg(target_os = "macos")]
    {
        unsafe { pv_wake_supported() }
    }
    #[cfg(not(target_os = "macos"))]
    false
}

pub fn start(app: &AppHandle, name: &str) -> Result<(), String> {
    begin(app, name, false, true)
}

fn begin(app: &AppHandle, name: &str, testing: bool, automatic: bool) -> Result<(), String> {
    if !supported() {
        return Err("On-device wake recognition is unavailable.".into());
    }
    let phrase = CString::new(format!("hey {}", name.trim().to_lowercase()))
        .map_err(|_| "The assistant name cannot be used as a wake phrase.".to_string())?;
    let _ = APP.set(app.clone());
    let _publication = PUBLICATION
        .lock()
        .unwrap_or_else(|error| error.into_inner());
    if automatic {
        if app
            .state::<super::state::OrchestratorState>()
            .0
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .exiting
        {
            return Ok(());
        }
        let configured = app
            .state::<crate::preferences::PreferencesStore>()
            .snapshot()
            .preferences
            .app
            .orchestrator;
        if !configured.enabled
            || !configured.wake_enabled
            || configured.display_name.trim() != name.trim()
            || !crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref())
        {
            return Ok(());
        }
    }
    TESTING.store(testing, Ordering::SeqCst);
    app.state::<super::state::OrchestratorState>()
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .wake_status = Some("Starting wake listener".into());
    let generation = GENERATION.fetch_add(1, Ordering::SeqCst).wrapping_add(1);
    #[cfg(target_os = "macos")]
    unsafe {
        pv_wake_start(phrase.as_ptr(), generation, wake_callback);
    }
    Ok(())
}

pub fn stop(app: &AppHandle) {
    let _publication = PUBLICATION
        .lock()
        .unwrap_or_else(|error| error.into_inner());
    GENERATION.fetch_add(1, Ordering::SeqCst);
    #[cfg(target_os = "macos")]
    unsafe {
        pv_wake_stop();
    }
    let state = app.state::<super::state::OrchestratorState>();
    {
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        runtime.wake_activated = false;
        runtime.wake_status = None;
    }
    state.emit(app);
}

extern "C" fn wake_callback(found: bool, message: *const c_char, generation: u64) {
    let Some(app) = APP.get() else { return };
    let testing = if found {
        let _publication = PUBLICATION
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        if generation != GENERATION.load(Ordering::SeqCst) {
            return;
        }
        TESTING.swap(false, Ordering::SeqCst)
    } else {
        false
    };
    let text = if message.is_null() {
        "Local wake status changed."
    } else {
        unsafe { CStr::from_ptr(message) }
            .to_str()
            .unwrap_or("Local wake status changed.")
    };
    eprintln!("[assistant wake] {text}");
    let state = app.state::<super::state::OrchestratorState>();
    state
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .wake_status = Some(text.to_string());
    let _ = app.emit("orchestrator-wake-status", text);
    state.emit(app);
    if found && testing {
        restart(app);
    } else if found {
        let app = app.clone();
        tauri::async_runtime::spawn(async move {
            if let Err(error) = activate(app.clone(), generation) {
                let _ = app.emit("orchestrator-wake-status", error);
                if generation == GENERATION.load(Ordering::SeqCst) {
                    restart(&app);
                }
            }
        });
    }
}

fn restart(app: &AppHandle) {
    let preferences = app
        .state::<crate::preferences::PreferencesStore>()
        .snapshot()
        .preferences;
    let configured = preferences.app.orchestrator;
    if configured.enabled
        && configured.wake_enabled
        && crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref())
    {
        let _ = start(app, &configured.display_name);
    }
}

fn activate(app: AppHandle, generation: u64) -> Result<(), String> {
    let configured = app
        .state::<crate::preferences::PreferencesStore>()
        .snapshot()
        .preferences
        .app
        .orchestrator;
    if generation != GENERATION.load(Ordering::SeqCst)
        || !configured.enabled
        || !configured.wake_enabled
    {
        return Err("Wake activation was canceled.".into());
    }
    if super::openai::api_key().is_none() {
        return Err("OpenAI key not found.".into());
    }
    if !crate::pet_studio::orchestrator_pet_ready(configured.pet_id.as_deref()) {
        return Err("The bundled Mossback assistant pet is unavailable.".into());
    }
    super::window::open_hidden(&app)?;
    let _publication = PUBLICATION
        .lock()
        .unwrap_or_else(|error| error.into_inner());
    let state = app.state::<super::state::OrchestratorState>();
    let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
    if generation != GENERATION.load(Ordering::SeqCst) {
        return Err("Wake activation was canceled.".into());
    }
    runtime.wake_activated = true;
    drop(runtime);
    state.emit(&app);
    Ok(())
}
