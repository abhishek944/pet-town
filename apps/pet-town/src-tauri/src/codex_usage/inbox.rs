use super::{model::Session, registration, storage};
#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;
use std::{
    fs,
    path::{Path, PathBuf},
};

fn directory(root: &Path) -> Option<PathBuf> {
    let directory = root.join("pending");
    if fs::symlink_metadata(&directory)
        .ok()
        .is_some_and(|meta| meta.file_type().is_symlink())
    {
        return None;
    }
    fs::create_dir_all(&directory).ok()?;
    #[cfg(unix)]
    fs::set_permissions(&directory, fs::Permissions::from_mode(0o700)).ok()?;
    Some(directory)
}

pub(super) fn enqueue(root: &Path, session: &Session) -> Option<()> {
    let key = crate::adapter_events::opaque_key(&session.session_id);
    let alias = crate::adapter_events::opaque_key(session.agents.first()?);
    let path = directory(root)?.join(format!("{key}-{alias}.json"));
    storage::save(&path, session)
}

pub(super) fn merge(root: &Path) {
    let Some(directory) = directory(root) else {
        return;
    };
    let Ok(entries) = fs::read_dir(directory) else {
        return;
    };
    for entry in entries
        .flatten()
        .filter(|entry| {
            matches!(
                entry.path().extension().and_then(|value| value.to_str()),
                Some("json" | "claimed")
            )
        })
        .take(128)
    {
        let path = entry.path();
        let extension = path.extension().and_then(|value| value.to_str());
        if !matches!(extension, Some("json" | "claimed")) {
            continue;
        }
        // Claim by rename so a new concurrent hook's atomic publish survives.
        let claimed = path.with_extension("claimed");
        if extension == Some("json") && fs::rename(&path, &claimed).is_err() {
            continue;
        }
        let Some(pending) = storage::load_metadata::<Session>(&claimed) else {
            let _ = fs::remove_file(claimed);
            continue;
        };
        if !registration::valid_session(&pending.session_id)
            || pending.agents.is_empty()
            || pending.agents.len() > 16
            || !pending.agents.iter().all(|id| storage::valid_agent(id))
            || pending
                .hook_model
                .iter()
                .any(|model| registration::safe_model(model).is_none())
        {
            let _ = fs::remove_file(claimed);
            continue;
        }
        let key = crate::adapter_events::opaque_key(&pending.session_id);
        let target = root.join(format!("{key}.json"));
        let mut session = storage::load(&target).unwrap_or_else(|| pending.clone());
        session.path = pending.path;
        session.transcript_root = pending.transcript_root;
        session.hook_model = pending.hook_model;
        session.inherited_history |= pending.inherited_history;
        for alias in pending.agents {
            if !session.agents.contains(&alias) {
                session.agents.push(alias);
            }
        }
        if session.agents.len() > 16 {
            session.agents.drain(..session.agents.len() - 16);
        }
        if storage::save(&target, &session).is_some() {
            let _ = fs::remove_file(claimed);
        }
    }
}
