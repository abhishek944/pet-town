use serde::Deserialize;
use std::time::Duration;
use tauri::{Manager, PhysicalPosition, PhysicalSize, WebviewWindow};

const WINDOW_BOTTOM_MARGIN: i32 = 8;

#[cfg(target_os = "macos")]
tauri_nspanel::tauri_panel! {
    panel!(PetPanel {
        config: {
            can_become_key_window: false,
            is_floating_panel: true
        }
    })
}

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
pub(crate) fn set_hit_regions(regions: Vec<HitRegion>, state: tauri::State<'_, HitRegions>) {
    if let Ok(mut stored) = state.0.lock() {
        *stored = regions;
    }
}

pub(crate) fn show_window(window: &WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let target = window.clone();
        window
            .run_on_main_thread(move || unsafe {
                use objc2_app_kit::NSWindow;
                if let Ok(native_window) = target.ns_window() {
                    let native_window: &NSWindow = &*native_window.cast();
                    native_window.orderFrontRegardless();
                }
            })
            .map_err(|error| error.to_string())
    }
    #[cfg(not(target_os = "macos"))]
    {
        window.show().map_err(|error| error.to_string())
    }
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
        .map(|stored| stored.clone())
        .unwrap_or_default();

    unsafe {
        let native_window: &NSWindow = &*window.ns_window()?.cast();
        let frame = native_window.frame();
        let mouse = NSEvent::mouseLocation();
        let local_x = mouse.x - frame.origin.x;
        let local_y = frame.size.height - (mouse.y - frame.origin.y);
        let over_citizen = regions.iter().any(|region| {
            local_x >= region.x
                && local_x <= region.x + region.width
                && local_y >= region.y
                && local_y <= region.y + region.height
        });
        native_window.setIgnoresMouseEvents(!over_citizen);
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

pub(crate) fn create_village_window(
    app: &mut tauri::App,
) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Regular);

    tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("index.html".into()))
        .title("Pet Town")
        // Additional transparent height lets Ocean water sit below boat hulls.
        // Standard pets retain their existing bottom-anchored on-screen position.
        .inner_size(1100.0, 290.0)
        .min_inner_size(320.0, 290.0)
        .resizable(true)
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .focusable(false)
        .focused(false)
        .accept_first_mouse(true)
        .skip_taskbar(false)
        .shadow(false)
        .visible(false)
        .visible_on_all_workspaces(true)
        .build()?;
    Ok(())
}

pub(crate) fn configure_window(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let window = app
        .get_webview_window("main")
        .ok_or("main village window was not created")?;

    window.set_ignore_cursor_events(true)?;

    #[cfg(target_os = "macos")]
    {
        use tauri_nspanel::{StyleMask, WebviewWindowExt};
        let panel = window.to_panel::<PetPanel>()?;
        panel.add_style_mask(StyleMask::empty().nonactivating_panel().into())?;
        panel.set_hides_on_deactivate(false);
    }

    #[cfg(target_os = "macos")]
    unsafe {
        use objc2_app_kit::{NSScreenSaverWindowLevel, NSWindow, NSWindowCollectionBehavior};

        let native_window: &NSWindow = &*window.ns_window()?.cast();
        // Full-screen apps occupy their own Space above the status-bar level.
        // Use the screen-saver level so pets remain visible over those windows.
        native_window.setLevel(NSScreenSaverWindowLevel);
        // Joining all Spaces alone does not join other applications' Spaces
        // (including Stage Manager and full-screen apps).
        let behavior = native_window.collectionBehavior()
            | NSWindowCollectionBehavior::CanJoinAllSpaces
            | NSWindowCollectionBehavior::CanJoinAllApplications
            | NSWindowCollectionBehavior::FullScreenAuxiliary
            | NSWindowCollectionBehavior::Stationary;
        native_window.setCollectionBehavior(behavior);
    }

    if let Some(monitor) = window.current_monitor()? {
        let area = monitor.work_area();
        let window_height = window.outer_size()?.height;
        window.set_size(PhysicalSize::new(area.size.width, window_height))?;
        let x = area.position.x;
        let y =
            area.position.y + area.size.height as i32 - window_height as i32 - WINDOW_BOTTOM_MARGIN;
        window.set_position(PhysicalPosition::new(x, y))?;
    }

    Ok(())
}
