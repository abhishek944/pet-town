mod activity;
mod coins;
mod model;
mod pricing;
mod reader;
mod registration;
mod snapshot;
mod storage;

pub(crate) use activity::attach_activity;
pub(crate) use model::Snapshot;
pub(crate) use registration::register;
const REFRESH_READ_LIMIT: usize = 4 * 1024 * 1024;

/// Called only from the existing blocking roster worker, never on the UI thread.
pub(crate) fn refresh() -> Snapshot {
    let Some(directory) = storage::secure_directory() else {
        return Snapshot::default();
    };
    let Some(_lock) = storage::lock(&directory) else {
        return Snapshot::default();
    };
    if crate::adapter_events::source_disabled("codex") {
        let mut snapshot = Snapshot::default();
        coins::attach(&directory, &[], &mut snapshot);
        return snapshot;
    }
    inbox::merge(&directory);
    let Ok(entries) = std::fs::read_dir(&directory) else {
        return Snapshot::default();
    };
    let mut sessions: Vec<_> = entries
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            if path.extension().and_then(|value| value.to_str()) != Some("json") {
                return None;
            }
            storage::load(&path).map(|session| (path, session))
        })
        .collect();
    sessions.sort_by(|left, right| left.0.cmp(&right.0));
    // Seed validated persisted counters before replay can replace/truncate them.
    let mut saved_coins = Snapshot::default();
    coins::attach(
        &directory,
        &sessions
            .iter()
            .map(|(_, session)| session.clone())
            .collect::<Vec<_>>(),
        &mut saved_coins,
    );
    let count = sessions.len();
    if count > 0 {
        let cursor_path = directory.join(".cursor");
        let start = storage::load_metadata::<usize>(&cursor_path).unwrap_or(0) % count;
        let mut next = start;
        let mut budget = REFRESH_READ_LIMIT;
        for step in 0..count {
            if budget < reader::MIN_BUDGET {
                break;
            }
            let index = (start + step) % count;
            let (path, session) = &mut sessions[index];
            let before = serde_json::to_vec(session).ok();
            let old_count = session.tokens.as_ref().and_then(|value| value.counted());
            reader::advance(session, &mut budget);
            let new_count = session.tokens.as_ref().and_then(|value| value.counted());
            let preserves_seed =
                old_count.is_none_or(|old| new_count.is_some_and(|new| new >= old));
            if (!saved_coins.coin_sync_unavailable || preserves_seed)
                && serde_json::to_vec(session).ok() != before
            {
                let _ = storage::save(path, session);
            }
            next = index + 1;
        }
        let _ = storage::save(&cursor_path, &next);
    }
    let sessions: Vec<_> = sessions.into_iter().map(|(_, session)| session).collect();
    let mut snapshot = snapshot::aggregate(&sessions);
    if saved_coins.coin_sync_unavailable {
        // Rewound checkpoints retain old counters for retry when seeding failed.
        snapshot.coins = saved_coins.coins;
        snapshot.coin_sync_unavailable = true;
    } else {
        coins::attach(&directory, &sessions, &mut snapshot);
    }
    snapshot
}

pub(crate) fn snapshot_from_cli() -> String {
    serde_json::to_string(&refresh()).unwrap_or_else(|_| "{}".into())
}
mod inbox;
