use std::fs::{File, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::os::fd::AsRawFd;
use std::path::PathBuf;

pub(crate) struct AppLock {
    _file: File,
}

pub(crate) fn lock_path() -> PathBuf {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            std::env::temp_dir().join(format!("pet-town-{}", unsafe { libc::geteuid() }))
        })
        .join(".local/state/pet-town/app.lock")
}

#[cfg(target_os = "macos")]
fn is_pet_town_process(pid: libc::pid_t) -> bool {
    let mut buffer = [0_u8; libc::PATH_MAX as usize];
    let length = unsafe {
        libc::proc_pidpath(
            pid,
            buffer.as_mut_ptr().cast(),
            u32::try_from(buffer.len()).unwrap_or(u32::MAX),
        )
    };
    if length <= 0 {
        return false;
    }
    std::path::Path::new(std::str::from_utf8(&buffer[..length as usize]).unwrap_or(""))
        .file_name()
        .is_some_and(|name| name == "pet-town")
}

#[cfg(not(target_os = "macos"))]
fn is_pet_town_process(pid: libc::pid_t) -> bool {
    unsafe { libc::kill(pid, 0) == 0 }
}

#[cfg(target_os = "macos")]
fn owns_lock(path: &std::path::Path, pid: libc::pid_t) -> bool {
    std::process::Command::new("lsof")
        .args(["-t", "--"])
        .arg(path)
        .output()
        .ok()
        .filter(|output| output.status.success())
        .and_then(|output| String::from_utf8(output.stdout).ok())
        .is_some_and(|owners| owners.lines().any(|owner| owner.trim() == pid.to_string()))
}

#[cfg(not(target_os = "macos"))]
fn owns_lock(_path: &std::path::Path, _pid: libc::pid_t) -> bool {
    true
}

fn notify_owner(file: &mut File, path: &std::path::Path) {
    for _ in 0..10 {
        let mut value = String::new();
        let _ = file.seek(SeekFrom::Start(0));
        let _ = file.read_to_string(&mut value);
        if let Ok(pid) = value.trim().parse::<libc::pid_t>() {
            if pid > 0 && is_pet_town_process(pid) && owns_lock(path, pid) {
                unsafe {
                    libc::kill(pid, libc::SIGUSR1);
                }
                return;
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(10));
    }
}

pub(crate) fn acquire_or_notify() -> Result<Option<AppLock>, String> {
    let path = lock_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let mut file = OpenOptions::new()
        .create(true)
        .truncate(false)
        .read(true)
        .write(true)
        .open(&path)
        .map_err(|error| error.to_string())?;
    let acquired = unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) } == 0;
    if !acquired {
        notify_owner(&mut file, &path);
        return Ok(None);
    }
    file.set_len(0).map_err(|error| error.to_string())?;
    file.write_all(format!("{}\n", std::process::id()).as_bytes())
        .map_err(|error| error.to_string())?;
    file.sync_data().map_err(|error| error.to_string())?;
    Ok(Some(AppLock { _file: file }))
}
