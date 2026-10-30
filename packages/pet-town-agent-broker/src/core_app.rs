//! Verified Herdr app presentation; Core still owns program identity/liveness.
use crate::{agents::safe_display_label, core_io};
use serde_json::{json, Value};
use std::collections::{BTreeSet, HashMap};

#[derive(Clone, PartialEq, Eq)]
struct AppTerminal {
    space: String,
    tab: String,
    label: Option<String>,
    status: Option<String>,
}

#[derive(Default)]
pub(crate) struct Presentation {
    terminals: HashMap<String, AppTerminal>,
}

impl Presentation {
    /// App acknowledgement only refines nonbusy program states. Never hide
    /// current work/permissions because an app snapshot still shows old idle.
    pub(crate) fn status<'a>(&'a self, terminal: &str, raw: &'a str) -> &'a str {
        if matches!(raw, "idle" | "done") {
            if let Some(status @ ("idle" | "done")) = self
                .terminals
                .get(terminal)
                .and_then(|entry| entry.status.as_deref())
            {
                return status;
            }
        }
        raw
    }

    pub(crate) fn label(&self, terminal: &str) -> Option<&str> {
        self.terminals.get(terminal)?.label.as_deref()
    }
}

fn space_ids(spaces: &[Value], local_only: bool) -> Option<BTreeSet<&str>> {
    let mut ids = BTreeSet::new();
    for space in spaces {
        if local_only {
            let machine = space.get("machine")?;
            if !machine.is_null() {
                machine.as_str().filter(|name| !name.is_empty())?;
                continue;
            }
        }
        let id = space["id"].as_str().filter(|id| !id.is_empty())?;
        if !ids.insert(id) {
            return None;
        }
    }
    Some(ids)
}

fn verified_world() -> Result<Value, String> {
    let unavailable = "Cannot verify the Herdr app's Core connection. Open a local space in the app connected to this Core, then retry.";
    // Bare terminal addresses cannot distinguish isolated cores. The app
    // mirrors its local space IDs from this document in its owning Core.
    let results = core_io::rpc(&[("doc.get", json!({"name":"herdr-app"}))]).ok_or(unavailable)?;
    let expected = results[0]["value"]["spaces"]
        .as_array()
        .and_then(|spaces| space_ids(spaces, false))
        .ok_or(unavailable)?;
    if expected.is_empty() {
        return Err(unavailable.into());
    }
    let output = core_io::execute(&core_io::binary(true), &["ls"], None).ok_or(unavailable)?;
    let world: Value = serde_json::from_str(&output).map_err(|_| unavailable)?;
    let actual = world["spaces"]
        .as_array()
        .and_then(|spaces| space_ids(spaces, true))
        .ok_or(unavailable)?;
    if actual != expected {
        return Err(unavailable.into());
    }
    Ok(world)
}

pub(crate) fn verify_context() -> Result<(), String> {
    verified_world().map(|_| ())
}

fn insert_unique(
    map: &mut HashMap<String, Option<AppTerminal>>,
    address: &str,
    entry: AppTerminal,
) {
    map.entry(address.to_string())
        .and_modify(|old| {
            if old.as_ref() != Some(&entry) {
                *old = None;
            }
        })
        .or_insert(Some(entry));
}

/// One optional app read per Core roster; failure never removes raw Core pets.
pub(crate) fn snapshot() -> Presentation {
    let Ok(world) = verified_world() else {
        return Presentation::default();
    };
    let mut terminals = HashMap::new();
    let mut children = HashMap::new();
    for space in world["spaces"].as_array().into_iter().flatten() {
        let Some(id) = space["id"].as_str() else {
            continue;
        };
        let space_name = safe_display_label(space["name"].as_str());
        for (index, tab) in space["tabs"].as_array().into_iter().flatten().enumerate() {
            let Some(tab_id) = tab["id"].as_str() else {
                continue;
            };
            let label = space_name.as_deref().map(|space| {
                crate::labels::space_tab_label(
                    space,
                    tab["name"].as_str(),
                    u32::try_from(index + 1).ok(),
                )
            });
            for terminal in tab["terminals"].as_array().into_iter().flatten() {
                let Some(address) = terminal["terminal"].as_str() else {
                    continue;
                };
                let entry = AppTerminal {
                    space: id.to_string(),
                    tab: tab_id.to_string(),
                    label: safe_display_label(terminal["name"].as_str()).or_else(|| label.clone()),
                    status: terminal["status"].as_str().map(str::to_string),
                };
                insert_unique(&mut terminals, address, entry.clone());
                for child in terminal["sub_agents"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .filter_map(Value::as_str)
                {
                    // ls lists child addresses, not their own seen state. Only
                    // inherit space-tab, not the parent's explicit label;
                    // a child's own pane wins below.
                    insert_unique(
                        &mut children,
                        child,
                        AppTerminal {
                            label: label.clone(),
                            status: None,
                            ..entry.clone()
                        },
                    );
                }
            }
        }
    }
    for (child, entry) in children {
        terminals.entry(child).or_insert(entry);
    }
    Presentation {
        terminals: terminals
            .into_iter()
            .filter_map(|(id, entry)| Some((id, entry?)))
            .collect(),
    }
}
