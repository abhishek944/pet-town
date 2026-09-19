use serde::Deserialize;
use std::time::Duration;
use tauri::{Manager, PhysicalPosition, PhysicalSize};

const WINDOW_BOTTOM_MARGIN: i32 = 8;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HitRegion {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

#[derive(Default)]
pub(crate) struct HitRegions(std::sync::Mutex<Vec<HitRegion>>);

#[tauri::command]
pub(crate) fn set_hit_regions(
    window: tauri::WebviewWindow,
    regions: Vec<HitRegion>,
    state: tauri::State<'_, HitRegions>,
) {
    if window.label() != "main" {
        return;
    }
    if let Ok(mut stored) = state.0.lock() {
        *stored = regions;
    }
}

#[tauri::command]
pub(crate) fn show_village(window: tauri::WebviewWindow) -> Result<(), String> {
    window.show().map_err(|error| error.to_string())
}

pub(crate) fn show_settings(app: &tauri::AppHandle) -> Result<(), String> {
    open_utility(
        app,
        "settings",
        "settings.html",
        "Pet Town v2 Settings",
        880.0,
        720.0,
    )
}

#[tauri::command]
pub(crate) fn open_settings(app: tauri::AppHandle) -> Result<(), String> {
    show_settings(&app)
}

pub(crate) fn show_playroom(app: &tauri::AppHandle) -> Result<(), String> {
    if !crate::storage::playroom_enabled() {
        return Err("Playroom is disabled in Settings".to_string());
    }
    open_utility(
        app,
        "playroom",
        "playroom.html",
        "Pet Town Playroom",
        980.0,
        680.0,
    )
}

#[tauri::command]
pub(crate) fn open_playroom(app: tauri::AppHandle) -> Result<(), String> {
    show_playroom(&app)
}

fn open_utility(
    app: &tauri::AppHandle,
    label: &str,
    path: &str,
    title: &str,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(label) {
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
        return Ok(());
    }
    tauri::WebviewWindowBuilder::new(app, label, tauri::WebviewUrl::App(path.into()))
        .title(title)
        .inner_size(width, height)
        .min_inner_size(700.0, 560.0)
        .resizable(true)
        .build()
        .map(|_| ())
        .map_err(|error| error.to_string())
}

pub(crate) fn create_village_window(
    app: &mut tauri::App,
) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Accessory);
    tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("index.html".into()))
        .title("Pet Town v2")
        .inner_size(1100.0, 220.0)
        .min_inner_size(320.0, 220.0)
        .resizable(true)
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .focusable(true)
        .accept_first_mouse(true)
        .skip_taskbar(true)
        .shadow(false)
        .visible(false)
        .visible_on_all_workspaces(true)
        .build()?;
    Ok(())
}

pub(crate) fn configure_window(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let window = app
        .get_webview_window("main")
        .ok_or("main village window is closed")?;
    window.set_ignore_cursor_events(true)?;
    if let Some(monitor) = window.current_monitor()? {
        let area = monitor.work_area();
        let height = window.outer_size()?.height;
        window.set_size(PhysicalSize::new(area.size.width, height))?;
        window.set_position(PhysicalPosition::new(
            area.position.x,
            area.position.y + area.size.height as i32 - height as i32 - WINDOW_BOTTOM_MARGIN,
        ))?;
    }
    Ok(())
}

#[cfg(target_os = "macos")]
fn refresh_mouse_passthrough(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    use objc2_app_kit::{NSEvent, NSWindow};
    let window = app
        .get_webview_window("main")
        .ok_or("main village window is closed")?;
    let regions = app
        .state::<HitRegions>()
        .0
        .lock()
        .map(|value| value.clone())
        .unwrap_or_default();
    unsafe {
        let native_window: &NSWindow = &*window.ns_window()?.cast();
        let frame = native_window.frame();
        let mouse = NSEvent::mouseLocation();
        let x = mouse.x - frame.origin.x;
        let y = frame.size.height - (mouse.y - frame.origin.y);
        let active = regions.iter().any(|region| {
            x >= region.x
                && x <= region.x + region.width
                && y >= region.y
                && y <= region.y + region.height
        });
        native_window.setIgnoresMouseEvents(!active);
    }
    Ok(())
}

#[cfg(target_os = "macos")]
pub(crate) fn start_hit_test_loop(app: tauri::AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(33));
        let target = app.clone();
        if app
            .run_on_main_thread(move || {
                let _ = refresh_mouse_passthrough(&target);
            })
            .is_err()
        {
            break;
        }
    });
}
