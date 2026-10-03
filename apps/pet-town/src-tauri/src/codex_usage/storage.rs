use super::model::Session;
use fs2::FileExt;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
#[cfg(unix)]
use std::os::unix::fs::{MetadataExt, OpenOptionsExt, PermissionsExt};
use std::path::{Path, PathBuf};

pub(super) fn directory() -> Option<PathBuf> {
    if let Some(path) = std::env::var_os("PET_TOWN_USAGE_DIRECTORY") {
        let path = PathBuf::from(path);
        return path.is_absolute().then_some(path);
    }
    Some(PathBuf::from(std::env::var_os("HOME")?).join(".pet-town/codex-usage"))
}

pub(super) fn secure_directory() -> Option<PathBuf> {
    let directory = directory()?;
    let parent = directory.parent()?;
    let managed_parent = std::env::var_os("PET_TOWN_USAGE_DIRECTORY").is_none();
    if !managed_parent && !parent.is_dir() {
        return None;
    }
    for path in [parent, directory.as_path()] {
        if fs::symlink_metadata(path)
            .ok()
            .is_some_and(|meta| meta.file_type().is_symlink())
        {
            return None;
        }
        if path == parent && !managed_parent {
            continue;
        }
        fs::create_dir_all(path).ok()?;
        #[cfg(unix)]
        {
            let meta = fs::metadata(path).ok()?;
            if meta.uid() != unsafe { libc::geteuid() } {
                return None;
            }
            fs::set_permissions(path, fs::Permissions::from_mode(0o700)).ok()?;
        }
    }
    Some(directory)
}

pub(super) fn lock(directory: &Path) -> Option<File> {
    let mut options = OpenOptions::new();
    options.read(true).write(true).create(true);
    #[cfg(unix)]
    options.mode(0o600).custom_flags(libc::O_NOFOLLOW);
    let file = options.open(directory.join(".lock")).ok()?;
    let started = std::time::Instant::now();
    loop {
        match file.try_lock_exclusive() {
            Ok(()) => break,
            Err(error)
                if error.kind() == std::io::ErrorKind::WouldBlock
                    && started.elapsed() < std::time::Duration::from_millis(200) =>
            {
                std::thread::sleep(std::time::Duration::from_millis(10));
            }
            Err(_) => return None,
        }
    }
    Some(file)
}

pub(super) fn private_open(path: &Path) -> Option<File> {
    let mut options = OpenOptions::new();
    options.read(true);
    #[cfg(unix)]
    options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    let file = options.open(path).ok()?;
    let metadata = file.metadata().ok()?;
    if !metadata.is_file() {
        return None;
    }
    #[cfg(unix)]
    if metadata.uid() != unsafe { libc::geteuid() } {
        return None;
    }
    Some(file)
}

pub(super) fn load_metadata<T: serde::de::DeserializeOwned>(path: &Path) -> Option<T> {
    let mut bytes = Vec::new();
    private_open(path)?
        .take(64 * 1024 + 1)
        .read_to_end(&mut bytes)
        .ok()?;
    if bytes.len() > 64 * 1024 {
        return None;
    }
    serde_json::from_slice(&bytes).ok()
}

pub(super) fn load(path: &Path) -> Option<Session> {
    let session: Session = load_metadata(path)?;
    let expected = crate::adapter_events::opaque_key(&session.session_id.to_ascii_lowercase());
    let safe_models = session
        .model
        .iter()
        .chain(session.hook_model.iter())
        .chain(session.models.keys())
        .all(|model| super::registration::safe_model(model).is_some());
    (session.version == 1
        && session.agents.len() <= 16
        && safe_models
        && path.file_stem()?.to_str()? == expected
        && session.agents.iter().all(|agent| valid_agent(agent)))
    .then_some(session)
}

pub(super) fn valid_agent(agent: &str) -> bool {
    let hash =
        |value: &str| value.len() == 16 && value.bytes().all(|byte| byte.is_ascii_hexdigit());
    if let Some(value) = agent.strip_prefix("codex:") {
        return hash(value);
    }
    let Some(value) = agent.strip_prefix("herdr:") else {
        return false;
    };
    let Some((namespace, session)) = value.split_once(':') else {
        return false;
    };
    (namespace == "default" || hash(namespace)) && hash(session)
}

pub(super) fn save<T: serde::Serialize>(path: &Path, session: &T) -> Option<()> {
    let bytes = serde_json::to_vec(session).ok()?;
    if bytes.len() > 64 * 1024 {
        return None;
    }
    let temporary = path.with_extension(format!("tmp-{}", std::process::id()));
    let mut options = OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    options.mode(0o600).custom_flags(libc::O_NOFOLLOW);
    let mut file = options.open(&temporary).ok()?;
    #[cfg(unix)]
    file.set_permissions(fs::Permissions::from_mode(0o600))
        .ok()?;
    file.write_all(&bytes).ok()?;
    file.sync_all().ok()?;
    fs::rename(temporary, path).ok()
}

pub(super) fn identity(file: &File) -> Option<String> {
    let metadata = file.metadata().ok()?;
    #[cfg(unix)]
    return Some(format!("{}:{}", metadata.dev(), metadata.ino()));
    #[cfg(not(unix))]
    Some(format!("{:?}", metadata.created().ok()?))
}
