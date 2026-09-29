use std::sync::atomic::{AtomicBool, Ordering};

static REQUESTED: AtomicBool = AtomicBool::new(false);

extern "C" fn request(_signal: libc::c_int) {
    REQUESTED.store(true, Ordering::SeqCst);
}

pub fn install() {
    unsafe {
        libc::signal(libc::SIGIO, request as *const () as libc::sighandler_t);
    }
}

pub fn take() -> bool {
    REQUESTED.swap(false, Ordering::SeqCst)
}
