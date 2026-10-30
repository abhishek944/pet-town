//! Bind trusted local harness hooks to the Core program that actually owns them.
use crate::{core, core_io};
use std::collections::{HashMap, HashSet};

/// Core has no native harness session ID. Verify ancestry instead of trusting an
/// inherited address alone; no proof leaves the independent harness pet intact.
#[cfg(unix)]
pub fn hosted_owner_key() -> Option<String> {
    let terminal = std::env::var("HC_TERMINAL_ID").ok()?;
    let target = core::current(&terminal)?;
    let program = target.local_pid()?;
    let output = core_io::execute(
        std::ffi::OsStr::new("/bin/ps"),
        &["-axo", "pid=,ppid="],
        None,
    )?;
    let parents: HashMap<u32, u32> = output
        .lines()
        .filter_map(|line| {
            let mut columns = line.split_whitespace();
            Some((columns.next()?.parse().ok()?, columns.next()?.parse().ok()?))
        })
        .collect();
    let mut pid = std::process::id();
    let mut visited = HashSet::new();
    while pid > 1 && visited.insert(pid) {
        if pid == program {
            return Some(target.owner_key());
        }
        pid = *parents.get(&pid)?;
    }
    None
}

#[cfg(not(unix))]
pub fn hosted_owner_key() -> Option<String> {
    // No process-ancestry proof is implemented on this platform yet.
    None
}
