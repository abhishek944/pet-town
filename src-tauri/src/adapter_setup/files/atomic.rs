use super::{make_private, read_regular_file};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
#[cfg(target_os = "macos")]
use std::{ffi::CString, os::unix::ffi::OsStrExt};

fn unique_path(path: &Path, purpose: &str) -> std::path::PathBuf {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    path.with_extension(format!("{purpose}-{}-{stamp}", std::process::id()))
}

pub(crate) fn write_private_backup(path: &Path, bytes: &[u8], label: &str) -> Result<(), String> {
    let backup = unique_path(path, "agent-pets-backup");
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&backup)
        .map_err(|_| format!("could not create {label} backup"))?;
    make_private(&file)?;
    file.write_all(bytes)
        .map_err(|_| format!("could not back up {label}"))?;
    file.sync_all()
        .map_err(|_| format!("could not flush {label} backup"))
}

#[cfg(target_os = "macos")]
fn rename_exclusive(left: &Path, right: &Path) -> Result<(), ()> {
    let left = CString::new(left.as_os_str().as_bytes()).map_err(|_| ())?;
    let right = CString::new(right.as_os_str().as_bytes()).map_err(|_| ())?;
    let result = unsafe {
        libc::renameatx_np(
            libc::AT_FDCWD,
            left.as_ptr(),
            libc::AT_FDCWD,
            right.as_ptr(),
            libc::RENAME_EXCL,
        )
    };
    if result == 0 {
        Ok(())
    } else {
        Err(())
    }
}

fn publish(
    path: &Path,
    temporary: &Path,
    expected: Option<&[u8]>,
    label: &str,
) -> Result<(), String> {
    if expected.is_none() {
        if fs::hard_link(temporary, path).is_err() {
            let _ = fs::remove_file(temporary);
            return Err(format!(
                "{label} appeared while it was being updated; try again"
            ));
        }
        return fs::remove_file(temporary)
            .map_err(|_| format!("could not finish replacing {label}"));
    }
    #[cfg(target_os = "macos")]
    {
        let displaced = unique_path(path, "agent-pets-conflict");
        if rename_exclusive(path, &displaced).is_err() {
            let _ = fs::remove_file(temporary);
            return Err(format!("could not safely stage {label}"));
        }
        if read_regular_file(&displaced, label)
            .ok()
            .flatten()
            .as_deref()
            != expected
        {
            let _ = rename_exclusive(&displaced, path);
            let _ = fs::remove_file(temporary);
            return Err(format!(
                "{label} changed while it was being updated; try again"
            ));
        }
        if rename_exclusive(temporary, path).is_err() {
            let _ = rename_exclusive(&displaced, path);
            let _ = fs::remove_file(temporary);
            return Err(format!(
                "{label} appeared while it was being updated; try again"
            ));
        }
        fs::remove_file(displaced).map_err(|_| format!("could not finish replacing {label}"))
    }
    #[cfg(not(target_os = "macos"))]
    fs::rename(temporary, path).map_err(|_| {
        let _ = fs::remove_file(temporary);
        format!("could not replace {label}")
    })
}

pub(crate) fn remove_conditionally(
    path: &Path,
    expected: &[u8],
    label: &str,
) -> Result<(), String> {
    let displaced = unique_path(path, "remove");
    #[cfg(target_os = "macos")]
    rename_exclusive(path, &displaced).map_err(|_| format!("could not remove {label}"))?;
    #[cfg(not(target_os = "macos"))]
    fs::rename(path, &displaced).map_err(|_| format!("could not remove {label}"))?;
    if read_regular_file(&displaced, label)
        .ok()
        .flatten()
        .as_deref()
        != Some(expected)
    {
        #[cfg(target_os = "macos")]
        let restored = rename_exclusive(&displaced, path).is_ok();
        #[cfg(not(target_os = "macos"))]
        let restored = fs::hard_link(&displaced, path).is_ok();
        if restored {
            let _ = fs::remove_file(&displaced);
        }
        return Err(format!(
            "{label} changed while it was being removed; try again"
        ));
    }
    fs::remove_file(displaced).map_err(|_| format!("could not finish removing {label}"))
}

pub(crate) fn write_atomic(
    path: &Path,
    bytes: &[u8],
    expected: Option<&[u8]>,
    label: &str,
) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| format!("{label} path has no parent"))?;
    fs::create_dir_all(parent).map_err(|_| format!("could not create the {label} directory"))?;
    let current = read_regular_file(path, label)?;
    if current.as_deref() != expected {
        return Err(format!(
            "{label} changed while it was being updated; try again"
        ));
    }
    if let Some(original) = current.as_ref() {
        write_private_backup(path, original, label)?;
    }
    let temporary = unique_path(path, "tmp");
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temporary)
        .map_err(|_| format!("could not create temporary {label}"))?;
    make_private(&file)?;
    file.write_all(bytes)
        .map_err(|_| format!("could not write {label}"))?;
    file.sync_all()
        .map_err(|_| format!("could not flush {label}"))?;
    if read_regular_file(path, label)?.as_deref() != expected {
        let _ = fs::remove_file(&temporary);
        return Err(format!(
            "{label} changed while it was being updated; try again"
        ));
    }
    publish(path, &temporary, expected, label)
}
