use tauri::{Monitor, PhysicalPosition, PhysicalSize, WebviewWindow};

struct StreetGeometry {
    width: u32,
    height: u32,
    x: i32,
    y: i32,
}

/// Keep the current physical height, including manual resizing and native scale changes.
fn desired_street_geometry(
    window: &WebviewWindow,
    monitor: &Monitor,
) -> Result<StreetGeometry, String> {
    let area = monitor.work_area();
    let height = window
        .outer_size()
        .map_err(|error| error.to_string())?
        .height;
    Ok(StreetGeometry {
        width: area.size.width,
        height,
        x: area.position.x,
        y: area.position.y + area.size.height as i32 - height as i32,
    })
}

pub(crate) fn place_street_window(window: &WebviewWindow, monitor: &Monitor) -> Result<(), String> {
    let target = desired_street_geometry(window, monitor)?;
    window
        .set_size(PhysicalSize::new(target.width, target.height))
        .map_err(|error| error.to_string())?;
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
    Ok(size.width == target.width
        && size.height == target.height
        && position.x == target.x
        && position.y == target.y)
}
