use super::{archive, download, local, TownInstall};
use std::fs;
use tauri::{AppHandle, Manager};

pub(super) fn remove(app: &AppHandle) -> Result<(), String> {
    let root = local::root(app)?;
    let selected = local::selected(app).ok();
    match fs::remove_file(root.join("active.json")) {
        Ok(()) => (),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
        Err(e) => return Err(e.to_string()),
    }
    if let Some(path) = selected {
        fs::remove_dir_all(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
pub(super) fn install(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<TownInstall>();
    let root = local::root(app)?;
    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    crate::preferences_permissions::restrict_directory(&root)?;
    clean_partials(&root)?;
    let id = uuid::Uuid::new_v4().to_string();
    let stage = root.join(format!(".partial-{id}"));
    let archive_path = root.join(format!(".download-{id}"));
    let pointer = root.join(format!(".active-{id}"));
    let destination = root.join(&id);
    let previous = local::selected(app).ok();
    let result = (|| {
        fs::create_dir(&stage).map_err(|e| e.to_string())?;
        state.phase(app, "downloading");
        tauri::async_runtime::block_on(download::run(app, &archive_path))?;
        archive::extract(app, &archive_path, &stage)?;
        {
            let mut inner = state.lock();
            if inner.cancelled {
                return Err("Pet Town download cancelled.".into());
            }
            // This transition closes cancellation before publication starts.
            inner.snapshot.phase = "installing";
        }
        state.publish(app);
        let mut inner = state.lock();
        fs::rename(&stage, &destination).map_err(|e| e.to_string())?;
        let bytes = serde_json::to_vec(&id).map_err(|e| e.to_string())?;
        fs::write(&pointer, bytes).map_err(|e| e.to_string())?;
        fs::File::open(&pointer)
            .and_then(|f| f.sync_all())
            .map_err(|e| e.to_string())?;
        fs::rename(&pointer, root.join("active.json")).map_err(|e| e.to_string())?;
        inner.committed = true;
        Ok(())
    })();
    let _ = fs::remove_file(archive_path);
    let _ = fs::remove_file(pointer);
    let _ = fs::remove_dir_all(stage);
    if result.is_err() {
        let _ = fs::remove_dir_all(destination);
    } else if let Some(previous) = previous {
        let _ = fs::remove_dir_all(previous);
    }
    result
}

// Explicit installs inspect only a bounded number of entries. Never follow links,
// touch the active pointer or remove UUID-named successful installations.
fn clean_partials(root: &std::path::Path) -> Result<(), String> {
    for entry in fs::read_dir(root).map_err(|e| e.to_string())?.take(512) {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name();
        let Some(name) = name.to_str() else {
            continue;
        };
        let prefix = [".partial-", ".download-", ".active-"]
            .into_iter()
            .find(|p| name.starts_with(p));
        let Some(prefix) = prefix else {
            continue;
        };
        let id = &name[prefix.len()..];
        if !uuid::Uuid::parse_str(id).is_ok_and(|uuid| uuid.to_string() == id) {
            continue;
        }
        let kind = entry.file_type().map_err(|e| e.to_string())?;
        if prefix == ".partial-" && kind.is_dir() {
            fs::remove_dir_all(entry.path()).map_err(|e| e.to_string())?;
        } else if prefix != ".partial-" && kind.is_file() {
            fs::remove_file(entry.path()).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
