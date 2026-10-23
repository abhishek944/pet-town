use objc2_app_kit::{NSApplication, NSWindow, NSWindowCollectionBehavior};
use std::{
    cell::{Cell, RefCell},
    collections::{HashMap, HashSet},
    time::{Duration, Instant},
};
use tauri::{AppHandle, WebviewWindow};
use tauri_nspanel::objc2::MainThreadMarker;

#[derive(Clone, Copy)]
enum Recovery {
    Deferred,
    Moving {
        behavior: NSWindowCollectionBehavior,
        started: Instant,
        turn: u64,
    },
    Verifying {
        started: Instant,
        turn: u64,
    },
    Failed,
}

const HEALTHY_CHECK_INTERVAL: Duration = Duration::from_millis(80);

thread_local! {
    static RECOVERIES: RefCell<HashMap<isize, Recovery>> = RefCell::new(HashMap::new());
    static TURN: Cell<u64> = const { Cell::new(0) };
    static LAST_CHECK: Cell<Option<Instant>> = const { Cell::new(None) };
}

pub(crate) fn show(window: &WebviewWindow) -> Result<(), String> {
    present(window, true).map(|_| ())
}

pub(crate) fn reconcile(app: &AppHandle) -> Result<(), String> {
    TURN.with(|turn| turn.set(turn.get().wrapping_add(1)));
    let recovering = RECOVERIES.with(|states| {
        states
            .borrow()
            .values()
            .any(|state| matches!(state, Recovery::Moving { .. } | Recovery::Verifying { .. }))
    });
    // Cloning Tauri window handles wakes Tao's run loop. Healthy checks must
    // return before enumeration or MainEventsCleared continually wakes itself.
    // Pending repairs still advance on real loop turns, never a timer tick.
    if !recovering
        && LAST_CHECK.with(|last| {
            last.get()
                .is_some_and(|checked| checked.elapsed() < HEALTHY_CHECK_INTERVAL)
        })
    {
        return Ok(());
    }
    LAST_CHECK.with(|last| last.set(Some(Instant::now())));
    let mut live = HashSet::new();
    for window in crate::street_windows::street_windows(app) {
        live.insert(present(&window, false)?);
    }
    RECOVERIES.with(|states| states.borrow_mut().retain(|id, _| live.contains(id)));
    Ok(())
}

fn remember(id: isize, recovery: Option<Recovery>) {
    RECOVERIES.with(|states| {
        let mut states = states.borrow_mut();
        if let Some(recovery) = recovery {
            states.insert(id, recovery);
        } else {
            states.remove(&id);
        }
    });
}

fn present(window: &WebviewWindow, explicit: bool) -> Result<isize, String> {
    let main = MainThreadMarker::new().ok_or("Pet Street presentation needs the main thread")?;
    let pointer = window.ns_window().map_err(|error| error.to_string())?;
    // The main-thread marker and live WebviewWindow bound this native borrow.
    let native: &NSWindow = unsafe { &*pointer.cast() };
    let id = native.windowNumber();
    let recovery = RECOVERIES.with(|states| states.borrow().get(&id).copied());
    let eligible = crate::village_visibility::should_show(window);
    let hidden = NSApplication::sharedApplication(main).isHidden();
    if !eligible || hidden {
        if let Some(Recovery::Moving { behavior, .. }) = recovery {
            native.setCollectionBehavior(behavior);
        }
        let pending = explicit
            || matches!(
                recovery,
                Some(Recovery::Deferred | Recovery::Moving { .. } | Recovery::Verifying { .. })
            );
        remember(
            id,
            (eligible && hidden && pending).then_some(Recovery::Deferred),
        );
        return Ok(id);
    }

    let explicit = explicit || matches!(recovery, Some(Recovery::Deferred));
    let on_active_space = native.isOnActiveSpace();
    let turn = TURN.with(Cell::get);
    match recovery {
        Some(Recovery::Moving {
            behavior,
            started,
            turn: began,
        }) => {
            if started.elapsed() >= Duration::from_secs(1) {
                native.setCollectionBehavior(behavior);
                remember(id, Some(Recovery::Failed));
                eprintln!(
                    "Pet Street {} could not rejoin its active Space",
                    window.label()
                );
            } else if turn.wrapping_sub(began) >= 2 && on_active_space {
                // Skip the first cleared-events boundary; AppKit must process a full turn.
                native.setCollectionBehavior(behavior);
                remember(id, Some(Recovery::Verifying { started, turn }));
                native.orderFrontRegardless();
            }
            return Ok(id);
        }
        Some(Recovery::Verifying {
            started,
            turn: restored,
        }) => {
            if turn.wrapping_sub(restored) >= 2 && on_active_space {
                remember(id, None);
            } else if started.elapsed() >= Duration::from_secs(1) {
                // Keep the original deadline through restoration; never restart this attempt.
                remember(id, Some(Recovery::Failed));
                eprintln!(
                    "Pet Street {} all-Spaces restoration failed",
                    window.label()
                );
            }
            return Ok(id);
        }
        Some(Recovery::Failed) if !explicit && !on_active_space => return Ok(id),
        _ => remember(id, None),
    }

    let behavior = native.collectionBehavior();
    if !on_active_space
        && (explicit || native.isVisible())
        && behavior.contains(NSWindowCollectionBehavior::CanJoinAllSpaces)
    {
        remember(
            id,
            Some(Recovery::Moving {
                behavior,
                started: Instant::now(),
                turn,
            }),
        );
        native.setCollectionBehavior(
            (behavior & !NSWindowCollectionBehavior::CanJoinAllSpaces)
                | NSWindowCollectionBehavior::MoveToActiveSpace,
        );
        native.orderFrontRegardless();
    } else if explicit {
        native.orderFrontRegardless();
    }
    Ok(id)
}
