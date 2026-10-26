use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, Monitor, PhysicalPosition, PhysicalSize, WebviewWindow};

pub(crate) const STREET_PREFIX: &str = "street-";

#[derive(Clone, Copy)]
struct StreetLayout {
    canopy: bool,
    bottom_height_logical: f64,
}

/// Only Street shape history: created with its window and pruned on Destroyed.
#[derive(Default)]
pub(crate) struct StreetLayouts(Mutex<HashMap<String, StreetLayout>>);

pub(crate) fn register_street_layout(window: &WebviewWindow) {
    let initial = StreetLayout {
        canopy: canopy_selected(window),
        bottom_height_logical: 290.0,
    };
    window
        .app_handle()
        .state::<StreetLayouts>()
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .insert(window.label().to_string(), initial);
}

pub(crate) fn forget_street_layout(window: &tauri::Window) {
    window
        .app_handle()
        .state::<StreetLayouts>()
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .remove(window.label());
}

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

fn canopy_selected(window: &WebviewWindow) -> bool {
    window
        .app_handle()
        .try_state::<crate::preferences::PreferencesStore>()
        .map(|store| {
            let state = store
                .state
                .lock()
                .unwrap_or_else(|error| error.into_inner());
            state.applied.app.strip_theme == crate::preferences_model::StripTheme::Canopy
        })
        .unwrap_or(false)
}

struct StreetGeometry {
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    layout: StreetLayout,
    orientation_changed: bool,
}

/// Comparison is read-only. Only successful shape placement commits orientation/history.
/// Current window pixels use its scale; restored logical height uses the target display's scale.
fn desired_street_geometry(
    window: &WebviewWindow,
    monitor: &Monitor,
) -> Result<StreetGeometry, String> {
    let area = monitor.work_area();
    let canopy = canopy_selected(window);
    let previous = window
        .app_handle()
        .state::<StreetLayouts>()
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .get(window.label())
        .copied()
        .unwrap_or(StreetLayout {
            canopy,
            bottom_height_logical: 290.0,
        });
    let current_height = window
        .outer_size()
        .map_err(|error| error.to_string())?
        .height;
    let bottom_height_logical = if canopy && !previous.canopy {
        current_height as f64 / window.scale_factor().map_err(|error| error.to_string())?
    } else {
        previous.bottom_height_logical
    };
    let scale = monitor.scale_factor();
    let (width, height) = if canopy {
        (
            ((310.0 * scale).round() as u32).min(area.size.width),
            area.size.height,
        )
    } else {
        (
            area.size.width,
            if previous.canopy {
                (bottom_height_logical * scale).round() as u32
            } else {
                current_height
            },
        )
    };
    let x = area.position.x + area.size.width as i32 - width as i32;
    let y = area.position.y + area.size.height as i32 - height as i32;
    Ok(StreetGeometry {
        width,
        height,
        x,
        y,
        layout: StreetLayout {
            canopy,
            bottom_height_logical,
        },
        orientation_changed: previous.canopy != canopy,
    })
}

pub(crate) fn place_street_window(window: &WebviewWindow, monitor: &Monitor) -> Result<(), String> {
    let target = desired_street_geometry(window, monitor)?;
    window
        .set_size(PhysicalSize::new(target.width, target.height))
        .map_err(|error| error.to_string())?;
    // Size already changed even if positioning fails. Retain the original bottom
    // height now, so the next reconciliation never captures side height as bottom.
    window
        .app_handle()
        .state::<StreetLayouts>()
        .0
        .lock()
        .unwrap_or_else(|error| error.into_inner())
        .insert(window.label().to_string(), target.layout);
    window
        .set_position(PhysicalPosition::new(target.x, target.y))
        .map_err(|error| error.to_string())
}

fn window_geometry_matches(window: &WebviewWindow, monitor: &Monitor) -> Result<bool, String> {
    let target = desired_street_geometry(window, monitor)?;
    let size = window.outer_size().map_err(|error| error.to_string())?;
    let position = window.outer_position().map_err(|error| error.to_string())?;
    Ok(!target.orientation_changed
        && size.width == target.width
        && size.height == target.height
        && position.x == target.x
        && position.y == target.y)
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
