//! Private durable, monotonic receipts; never mint from an aggregate UI counter.
use super::{
    model::{CoinBalance, Session, Snapshot},
    storage,
};
use serde::{Deserialize, Serialize};
#[cfg(unix)]
use std::os::unix::fs::{MetadataExt, PermissionsExt};
use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
};

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Receipt {
    version: u8,
    credited_tokens: u64,
    earned_coins: u64,
    remainder_tokens: u64,
    agents: Vec<String>,
}

fn directory(parent: &Path) -> Option<PathBuf> {
    let path = parent.join("coin-receipts");
    if fs::symlink_metadata(&path)
        .ok()
        .is_some_and(|meta| meta.file_type().is_symlink())
    {
        return None;
    }
    fs::create_dir_all(&path).ok()?;
    #[cfg(unix)]
    {
        if fs::metadata(&path).ok()?.uid() != unsafe { libc::geteuid() } {
            return None;
        }
        fs::set_permissions(&path, fs::Permissions::from_mode(0o700)).ok()?;
    }
    Some(path)
}

fn receipts(directory: &Path) -> Option<BTreeMap<String, Receipt>> {
    let mut result = BTreeMap::new();
    for entry in fs::read_dir(directory).ok()? {
        let path = entry.ok()?.path();
        if path.extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }
        let key = path.file_stem()?.to_str()?;
        let receipt: Receipt = storage::load_metadata(&path)?;
        if key.len() != 16
            || !key.bytes().all(|byte| byte.is_ascii_hexdigit())
            || receipt.version != 1
            || receipt.remainder_tokens >= 1_000_000
            || receipt.agents.len() > 16
            || !receipt
                .agents
                .iter()
                .all(|agent| storage::valid_agent(agent))
        {
            return None;
        }
        result.insert(key.to_owned(), receipt);
    }
    Some(result)
}

fn update(
    directory: &Path,
    sessions: &[Session],
    mut saved: BTreeMap<String, Receipt>,
) -> Option<BTreeMap<String, Receipt>> {
    for session in sessions {
        if session.inherited_history {
            continue;
        }
        let Some(tokens) = &session.tokens else {
            continue;
        };
        // Cached input and reasoning are subsets. total_tokens may have a different
        // provider definition; only the disjoint input + output counters mint coins.
        let counted = tokens.counted()?;
        let key = crate::adapter_events::opaque_key(&session.session_id.to_ascii_lowercase());
        let previous = saved.get(&key);
        let credited_tokens = counted.max(previous.map_or(0, |value| value.credited_tokens));
        // Replacements/replay can restart below this watermark. Preserve earned
        // currency and only credit growth above it, never remint the history.
        let mut agents = previous.map_or_else(Vec::new, |value| value.agents.clone());
        agents.extend(session.agents.clone());
        agents.sort();
        agents.dedup();
        if agents.len() > 16 {
            return None;
        }
        if previous
            .is_some_and(|old| old.credited_tokens == credited_tokens && old.agents == agents)
        {
            continue;
        }
        let receipt = Receipt {
            version: 1,
            credited_tokens,
            // Persist currency separately from the usage watermark. Future
            // conversion revisions must apply only to the new counted delta.
            earned_coins: previous.map_or(0, |old| old.earned_coins),
            remainder_tokens: previous.map_or(0, |old| old.remainder_tokens),
            agents,
        };
        let delta = credited_tokens - previous.map_or(0, |old| old.credited_tokens);
        let carried = receipt.remainder_tokens.checked_add(delta)?;
        let receipt = Receipt {
            earned_coins: receipt.earned_coins.checked_add(carried / 1_000_000)?,
            remainder_tokens: carried % 1_000_000,
            ..receipt
        };
        storage::save(&directory.join(format!("{key}.json")), &receipt)?;
        // Publish one receipt atomically, then make the rename durable.
        fs::File::open(directory).ok()?.sync_all().ok()?;
        saved.insert(key, receipt);
    }
    Some(saved)
}

pub(super) fn attach(parent: &Path, sessions: &[Session], snapshot: &mut Snapshot) {
    let Some(directory) = directory(parent) else {
        snapshot.coin_sync_unavailable = true;
        return;
    };
    let Some(saved) = receipts(&directory) else {
        snapshot.coin_sync_unavailable = true;
        return;
    };
    let saved = match update(&directory, sessions, saved.clone()) {
        Some(updated) => updated,
        None => {
            // Readable earned currency survives a failed new credit write.
            snapshot.coin_sync_unavailable = true;
            saved
        }
    };
    if saved.is_empty() {
        return;
    } // No attributable reading: unknown, not zero.
    let mut total = 0_u64;
    let mut by_agent = BTreeMap::<String, u64>::new();
    for receipt in saved.values() {
        let Some(earned) = receipt
            .earned_coins
            .checked_mul(1_000_000)
            .and_then(|value| value.checked_add(receipt.remainder_tokens))
        else {
            return;
        };
        let Some(next) = total.checked_add(earned) else {
            return;
        };
        total = next;
        for agent in &receipt.agents {
            let value = by_agent.entry(agent.clone()).or_default();
            let Some(next) = value.checked_add(earned) else {
                return;
            };
            *value = next;
        }
    }
    snapshot.coins = CoinBalance::from_tokens(total);
    for (agent, reading) in &mut snapshot.by_agent {
        reading.coin_contribution = by_agent.get(agent).copied().map(CoinBalance::from_tokens);
    }
}
