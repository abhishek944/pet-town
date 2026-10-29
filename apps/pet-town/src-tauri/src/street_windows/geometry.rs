use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{Manager, Monitor, PhysicalPosition, PhysicalSize, WebviewWindow};

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

pub(super) fn window_geometry_matches(
    window: &WebviewWindow,
    monitor: &Monitor,
) -> Result<bool, String> {
    let target = desired_street_geometry(window, monitor)?;
    let size = window.outer_size().map_err(|error| error.to_string())?;
    let position = window.outer_position().map_err(|error| error.to_string())?;
    Ok(!target.orientation_changed
        && size.width == target.width
        && size.height == target.height
        && position.x == target.x
        && position.y == target.y)
}
