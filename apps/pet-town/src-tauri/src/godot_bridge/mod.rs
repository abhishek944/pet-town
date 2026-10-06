mod focus;
mod launch;
mod server;
mod terminal;
mod updates;
use crate::town_terminal::session::Session;
use std::{
    process::Child,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc, Mutex,
    },
};
use tauri::{AppHandle, Manager};

pub(super) struct Process {
    child: Child,
    cancel: Arc<AtomicBool>,
}
#[derive(Default)]
pub(crate) struct GodotState {
    process: Mutex<Option<Process>>,
    focused: AtomicBool,
    #[cfg(target_os = "macos")]
    owns_dock: AtomicBool,
    terminal: Mutex<Option<Arc<Session>>>,
    terminal_epoch: AtomicU64,
    update_error: Mutex<Option<String>>,
    window_serial: AtomicU64,
}

pub(crate) fn focus_from_cli(pid: u32, parent: u32) -> Result<(), String> {
    focus::activate(pid, parent)
}

pub(crate) fn open(app: &AppHandle) -> Result<(), String> {
    let updates = app.state::<crate::app_updates::AppUpdates>();
    let _opening = updates.window_opening()?;
    let state = app.state::<GodotState>();
    let mut process = state
        .process
        .lock()
        .map_err(|_| "Town launch is unavailable.")?;
    if let Some(current) = process.as_mut() {
        if current
            .child
            .try_wait()
            .map_err(|e| e.to_string())?
            .is_none()
        {
            state.window_serial.fetch_add(1, Ordering::SeqCst);
            return launch::focus(current.child.id());
        }
        current.cancel.store(true, Ordering::SeqCst);
    }
    let listener = std::net::TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let token = format!("{}{}", uuid::Uuid::new_v4(), uuid::Uuid::new_v4());
    let child = launch::spawn(app, port, &token)?;
    let cancel = Arc::new(AtomicBool::new(false));
    *process = Some(Process {
        child,
        cancel: cancel.clone(),
    });
    state.window_serial.fetch_add(1, Ordering::SeqCst);
    server::start(app.clone(), listener, token, cancel);
    drop(process);
    set_focused(app, false);
    Ok(())
}

pub(crate) fn running(app: &AppHandle) -> bool {
    app.state::<GodotState>()
        .process
        .lock()
        .is_ok_and(|process| process.is_some())
}
pub(crate) fn focused(app: &AppHandle) -> bool {
    let state = app.state::<GodotState>();
    state.focused.load(Ordering::SeqCst)
        && state.process.lock().is_ok_and(|process| {
            process
                .as_ref()
                .is_some_and(|process| launch::is_focused(process.child.id()))
        })
}
pub(super) fn set_focused(app: &AppHandle, active: bool) {
    #[cfg(target_os = "macos")]
    {
        let _ = active;
        let target = app.clone();
        // AppKit caches activation until the main run loop advances. A bridge
        // heartbeat or background-thread query must not override foreground state.
        let _ = app.run_on_main_thread(move || {
            let state = target.state::<GodotState>();
            let (native_running, active) = state
                .process
                .lock()
                .map(|process| {
                    (
                        process.is_some(),
                        process
                            .as_ref()
                            .is_some_and(|process| launch::is_focused(process.child.id())),
                    )
                })
                .unwrap_or((false, false));
            // The native world owns the Dock while open, even when unfocused.
            // Settings and the nonactivating pet panel remain in the desktop.
            if state.owns_dock.load(Ordering::SeqCst) != native_running {
                let policy = if native_running {
                    tauri::ActivationPolicy::Accessory
                } else {
                    tauri::ActivationPolicy::Regular
                };
                match target.set_activation_policy(policy) {
                    Ok(()) => state.owns_dock.store(native_running, Ordering::SeqCst),
                    Err(error) => eprintln!("Could not update Pet Town Dock ownership: {error}"),
                }
            }
            apply_focused(&target, active);
        });
    }
    #[cfg(not(target_os = "macos"))]
    apply_focused(app, active);
}

fn apply_focused(app: &AppHandle, active: bool) {
    let state = app.state::<GodotState>();
    if state.focused.swap(active, Ordering::SeqCst) != active {
        if !active {
            terminal::release(app);
        }
        crate::town_process::set_active(app, active);
    }
}
pub(crate) fn reap(app: &AppHandle) {
    let state = app.state::<GodotState>();
    let ended = {
        let mut process = state.process.lock().unwrap_or_else(|e| e.into_inner());
        if process
            .as_mut()
            .is_some_and(|p| !matches!(p.child.try_wait(), Ok(None)))
        {
            if let Some(process) = process.take() {
                process.cancel.store(true, Ordering::SeqCst);
            }
            true
        } else {
            false
        }
    };
    if ended {
        set_focused(app, false);
        terminal::release(app);
    } else {
        // Reconcile both directions even if Godot is busy rendering or its
        // snapshot connection is down. The control loop runs every 80 ms.
        #[cfg(target_os = "macos")]
        set_focused(app, false);
        #[cfg(not(target_os = "macos"))]
        if state.focused.load(Ordering::SeqCst) && !focused(app) {
            set_focused(app, false);
        }
    }
}
pub(crate) fn stop(app: &AppHandle) {
    if let Some(mut process) = app
        .state::<GodotState>()
        .process
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .take()
    {
        process.cancel.store(true, Ordering::SeqCst);
        let _ = process.child.kill();
        let _ = process.child.wait();
    }
    set_focused(app, false);
    terminal::release(app);
}
