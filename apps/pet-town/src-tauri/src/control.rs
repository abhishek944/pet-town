use crate::{preferences_commands, settings_window};
use std::fs;
use std::sync::atomic::{AtomicBool, AtomicI8, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Manager};

static OPEN_SETTINGS: AtomicBool = AtomicBool::new(false);
static RELOAD_PREFERENCES: AtomicBool = AtomicBool::new(false);
static VISIBILITY_REQUEST: AtomicI8 = AtomicI8::new(0);
static STOP: AtomicBool = AtomicBool::new(false);

#[cfg(unix)]
extern "C" fn request_settings(_signal: libc::c_int) {
    OPEN_SETTINGS.store(true, Ordering::SeqCst);
}

#[cfg(unix)]
extern "C" fn request_reload(_signal: libc::c_int) {
    RELOAD_PREFERENCES.store(true, Ordering::SeqCst);
}
#[cfg(unix)]
extern "C" fn request_show(_signal: libc::c_int) {
    VISIBILITY_REQUEST.store(1, Ordering::SeqCst);
}
#[cfg(unix)]
extern "C" fn request_hide(_signal: libc::c_int) {
    VISIBILITY_REQUEST.store(-1, Ordering::SeqCst);
}
#[cfg(unix)]
extern "C" fn request_stop(_signal: libc::c_int) {
    STOP.store(true, Ordering::SeqCst);
}

pub fn install_signal_handlers() {
    #[cfg(unix)]
    unsafe {
        libc::signal(
            libc::SIGUSR1,
            request_settings as *const () as libc::sighandler_t,
        );
        libc::signal(
            libc::SIGUSR2,
            request_reload as *const () as libc::sighandler_t,
        );
        libc::signal(
            libc::SIGCONT,
            request_show as *const () as libc::sighandler_t,
        );
        libc::signal(
            libc::SIGHUP,
            request_hide as *const () as libc::sighandler_t,
        );
        libc::signal(
            libc::SIGTERM,
            request_stop as *const () as libc::sighandler_t,
        );
    }
}

pub fn start(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(80));
        if STOP.swap(false, Ordering::SeqCst) {
            let target = app.clone();
            let _ = app.run_on_main_thread(move || target.exit(0));
        }
        let visibility = VISIBILITY_REQUEST.swap(0, Ordering::SeqCst);
        if visibility != 0 {
            let target = app.clone();
            let _ = app.run_on_main_thread(move || {
                let _ = crate::village_visibility::set(&target, visibility > 0);
            });
        }
        if OPEN_SETTINGS.swap(false, Ordering::SeqCst) {
            let target = app.clone();
            if app
                .run_on_main_thread(move || {
                    let _ = settings_window::open_internal(&target, None);
                })
                .is_err()
            {
                break;
            }
        }
        if RELOAD_PREFERENCES.swap(false, Ordering::SeqCst) {
            let session = app.state::<settings_window::SettingsSession>();
            let reload_generation = session.pause_for_reload(&app);
            let result = preferences_commands::reload_and_emit(&app);
            if let Some(generation) = reload_generation {
                session.resume_after_reload(&app, generation);
            }
            write_reload_result(result.as_ref().map(|_| ()).map_err(String::as_str));
        }
    });
}

fn write_reload_result(result: Result<(), &str>) {
    let Some(path) = crate::herdr_state::reload_result() else {
        return;
    };
    let temporary = path.with_extension(format!("tmp.{}", std::process::id()));
    let text = match result {
        Ok(()) => "ok\n".to_string(),
        Err(error) => format!("error: {error}\n"),
    };
    if fs::write(&temporary, text).is_ok() {
        let _ = fs::rename(temporary, path);
    }
}
