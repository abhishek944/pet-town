//! AppKit asks the existing Tao delegate for the desktop app's Dock menu.
//! Keep that delegate: replacing it would break Tauri lifecycle/window events.
use std::{cell::RefCell, sync::OnceLock};
use tauri_nspanel::{
    objc2::{
        class, ffi, msg_send,
        rc::{Allocated, Retained},
        runtime::{AnyObject, Sel},
        sel,
    },
    objc2_foundation::NSString,
};

static APP: OnceLock<tauri::AppHandle> = OnceLock::new();
thread_local! {
    static MENU: RefCell<Option<Retained<AnyObject>>> = const { RefCell::new(None) };
}

unsafe extern "C-unwind" fn dock_menu(
    _delegate: &AnyObject,
    _selector: Sel,
    _application: &AnyObject,
) -> *mut AnyObject {
    MENU.with(|menu| {
        menu.borrow()
            .as_ref()
            .map_or(std::ptr::null_mut(), |m| Retained::as_ptr(m).cast_mut())
    })
}

unsafe extern "C-unwind" fn select(_delegate: &AnyObject, _selector: Sel, item: &AnyObject) {
    let tag: isize = unsafe { msg_send![item, tag] };
    let actions = [
        "preferences",
        "open-3d-town",
        "close-3d-town",
        "show-town",
        "hide-town",
    ];
    if let (Some(app), Some(action)) = (APP.get(), actions.get(tag as usize)) {
        crate::app_menu::handle_event(app, action);
    }
}

pub(crate) fn install(app: &tauri::AppHandle) -> tauri::Result<()> {
    unsafe {
        let application: &AnyObject = msg_send![class!(NSApplication), sharedApplication];
        let delegate: &AnyObject = msg_send![application, delegate];
        // Add only our selectors; do not swizzle or replace existing methods.
        let menu_added = ffi::class_addMethod(
            delegate.class() as *const _ as *mut _,
            sel!(applicationDockMenu:),
            std::mem::transmute::<
                unsafe extern "C-unwind" fn(&AnyObject, Sel, &AnyObject) -> *mut AnyObject,
                unsafe extern "C-unwind" fn(),
            >(dock_menu),
            c"@@:@".as_ptr(),
        );
        let action_added = ffi::class_addMethod(
            delegate.class() as *const _ as *mut _,
            sel!(petTownDockAction:),
            std::mem::transmute::<
                unsafe extern "C-unwind" fn(&AnyObject, Sel, &AnyObject),
                unsafe extern "C-unwind" fn(),
            >(select),
            c"v@:@".as_ptr(),
        );
        if !menu_added.as_bool() || !action_added.as_bool() {
            return Err(std::io::Error::other("Could not install Pet Town Dock menu").into());
        }
        let _ = APP.set(app.clone());
        let menu: Retained<AnyObject> = msg_send![class!(NSMenu), new];
        let _: () = msg_send![&*menu, setAutoenablesItems: false];
        for (tag, title) in [
            "Settings",
            "Open Pet Town",
            "Close Pet Town",
            "Show Pet Street",
            "Hide Pet Street",
        ]
        .iter()
        .enumerate()
        {
            let item: Allocated<AnyObject> = msg_send![class!(NSMenuItem), alloc];
            let item: Retained<AnyObject> = msg_send![
                item, initWithTitle: &*NSString::from_str(title),
                action: sel!(petTownDockAction:), keyEquivalent: &*NSString::from_str("")
            ];
            let _: () = msg_send![&*item, setTarget: delegate];
            let _: () = msg_send![&*item, setTag: tag as isize];
            let _: () = msg_send![&*menu, addItem: &*item];
        }
        MENU.with(|stored| *stored.borrow_mut() = Some(menu));
    }
    Ok(())
}
