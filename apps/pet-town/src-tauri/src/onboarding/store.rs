use super::model::Progress;
use std::{fs, io::Write, path::PathBuf, sync::Mutex};

pub(super) struct Store {
    pub progress: Mutex<Progress>,
    path: Option<PathBuf>,
    error: Option<String>,
}
impl Default for Store {
    fn default() -> Self {
        let path = crate::preferences_io::preferences_path().ok();
        let existing = path.as_ref().is_some_and(|path| path.is_file());
        let path = path.map(|path| path.with_file_name("onboarding.json"));
        let mut error = None;
        let progress = match path.as_ref().map(fs::read) {
            Some(Ok(bytes)) => match serde_json::from_slice::<Progress>(&bytes) {
                Ok(value) if value.step <= 7 => value,
                _ => {
                    error = Some("Saved setup cannot be read. Your settings are preserved. Contact support before resetting setup.".into());
                    Progress {
                        completed: true,
                        ..Progress::default()
                    }
                }
            },
            Some(Err(err)) if err.kind() != std::io::ErrorKind::NotFound => {
                error = Some(
                    "Saved setup is unavailable. Check access to Pet Town’s local folder.".into(),
                );
                Progress {
                    completed: true,
                    ..Progress::default()
                }
            }
            _ => Progress {
                completed: existing,
                ..Progress::default()
            },
        };
        Self {
            progress: Mutex::new(progress),
            path,
            error,
        }
    }
}
impl Store {
    pub fn get(&self) -> Progress {
        self.progress
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .clone()
    }
    pub fn update(&self, edit: impl FnOnce(&mut Progress)) -> Result<Progress, String> {
        if let Some(error) = &self.error {
            return Err(error.clone());
        }
        let mut progress = self.progress.lock().unwrap_or_else(|e| e.into_inner());
        let mut next = progress.clone();
        edit(&mut next);
        let path = self.path.as_ref().ok_or("Setup storage is unavailable.")?;
        let directory = path.parent().ok_or("Setup folder is unavailable.")?;
        fs::create_dir_all(directory).map_err(|_| "Could not create the setup folder.")?;
        crate::preferences_permissions::restrict_directory(directory)?;
        let temporary = directory.join(format!(".onboarding-{}.json", uuid::Uuid::new_v4()));
        let result = (|| {
            let mut options = fs::OpenOptions::new();
            options.write(true).create_new(true);
            #[cfg(unix)]
            {
                use std::os::unix::fs::OpenOptionsExt;
                options.mode(0o600);
            }
            let mut file = options
                .open(&temporary)
                .map_err(|_| "Could not save setup progress.")?;
            let bytes =
                serde_json::to_vec(&next).map_err(|_| "Could not encode setup progress.")?;
            file.write_all(&bytes)
                .and_then(|_| file.sync_all())
                .map_err(|_| "Could not save setup progress.")?;
            fs::rename(&temporary, path).map_err(|_| "Could not commit setup progress.")?;
            Ok::<(), String>(())
        })();
        let _ = fs::remove_file(&temporary);
        result?;
        *progress = next.clone();
        Ok(next)
    }
}
