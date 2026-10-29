use serde::Serialize;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, Monitor, WebviewWindow};

mod geometry;
use geometry::window_geometry_matches;
pub(crate) use geometry::{
    forget_street_layout, place_street_window, register_street_layout, StreetLayouts,
};

pub(crate) const STREET_PREFIX: &str = "street-";

pub(crate) fn is_street_label(label: &str) -> bool {
    street_index(label).is_some()
}

fn street_index(label: &str) -> Option<usize> {
    label.strip_prefix(STREET_PREFIX)?.parse().ok()
}

/// Street windows ordered by display slot: street-0 is the leftmost monitor.
pub(crate) fn street_windows(app: &AppHandle) -> Vec<WebviewWindow> {
    let mut windows: Vec<(usize, WebviewWindow)> = app
        .webview_windows()
        .into_values()
        .filter_map(|window| street_index(window.label()).map(|index| (index, window)))
        .collect();
    windows.sort_by_key(|(index, _)| *index);
    windows.into_iter().map(|(_, window)| window).collect()
}

fn sorted_monitors(app: &AppHandle) -> Result<Vec<Monitor>, String> {
    let mut monitors = app
        .available_monitors()
        .map_err(|error| error.to_string())?;
    monitors.sort_by_key(|monitor| (monitor.position().x, monitor.position().y));
    Ok(monitors)
}

pub(crate) fn emit_to_streets<T: Serialize + Clone>(
    app: AppHandle,
    event: &str,
    payload: T,
) -> Result<(), String> {
    for window in street_windows(&app) {
        window
            .emit(event, payload.clone())
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct StreetsChanged {
    streets: usize,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct StreetAssignment {
    index: usize,
    total: usize,
}

#[tauri::command]
pub(crate) fn street_assignment(window: WebviewWindow) -> Result<StreetAssignment, String> {
    let labels: Vec<String> = street_windows(window.app_handle())
        .iter()
        .map(|window| window.label().to_string())
        .collect();
    let total = labels.len().max(1);
    let index = labels
        .iter()
        .position(|label| label == window.label())
        .unwrap_or(0);
    Ok(StreetAssignment { index, total })
}

/// Ensure exactly one strip window per monitor, each on its own work area.
/// Returns true when the street set changed and frontends must re-partition.
pub(crate) fn reconcile_street_windows(app: &AppHandle) -> Result<bool, String> {
    let monitors = sorted_monitors(app)?;
    // Display reconfiguration can briefly report no monitors. Retry next tick
    // rather than close every street and accidentally initiate app shutdown.
    if monitors.is_empty() {
        return Ok(false);
    }
    let mut streets = street_windows(app);
    let mut changed = false;
    while streets.len() > monitors.len() {
        if let Some(extra) = streets.pop() {
            // Restore Tao's native class and release the plugin's retained panel
            // before Tauri destroys it. Closing a converted NSPanel directly aborts.
            #[cfg(target_os = "macos")]
            let extra = {
                use tauri_nspanel::ManagerExt;
                match app.get_webview_panel(extra.label()) {
                    Ok(panel) => panel
                        .to_window()
                        .ok_or("Could not restore the retiring Pet Street window")?,
                    // An earlier close request may already have restored it.
                    Err(_) => extra,
                }
            };
            extra.close().map_err(|error| error.to_string())?;
            changed = true;
        }
    }
    for (index, monitor) in monitors.iter().enumerate() {
        let label = format!("{STREET_PREFIX}{index}");
        match app.get_webview_window(&label) {
            Some(window) => {
                if !window_geometry_matches(&window, monitor)? {
                    place_street_window(&window, monitor)?;
                }
            }
            None => {
                let window = crate::window::create_street_window(app, &label)
                    .map_err(|error| error.to_string())?;
                crate::window::configure_street_window(&window, monitor)
                    .map_err(|error| error.to_string())?;
                changed = true;
            }
        }
    }
    if changed {
        emit_to_streets(
            app.clone(),
            "streets-changed",
            StreetsChanged {
                streets: monitors.len(),
            },
        )?;
    }
    Ok(changed)
}

/// Apply a theme change promptly; the watcher remains the placement authority.
/// Scheduling also keeps preference reload callers off native window threads.
pub(crate) fn refresh_geometry(app: &AppHandle) {
    let target = app.clone();
    let _ = app.run_on_main_thread(move || {
        if let Err(error) = reconcile_street_windows(&target) {
            eprintln!("Could not update Pet Street geometry: {error}");
        }
    });
}

pub(crate) fn start_street_watcher(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(2));
        let target = app.clone();
        if app
            .run_on_main_thread(move || {
                if let Err(error) = reconcile_street_windows(&target) {
                    eprintln!("Could not update Pet Street displays: {error}");
                }
            })
            .is_err()
        {
            break;
        }
    });
}
