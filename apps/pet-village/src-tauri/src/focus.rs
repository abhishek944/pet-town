mod herdr;

pub(crate) use crate::focus_id::{herdr_owner_key, public_agent_id};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::ffi::OsString;
use std::sync::Mutex;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub(crate) enum FocusRoute {
    Herdr {
        pane_id: String,
        socket: Option<String>,
        agent_session_id: String,
    },
    Application {
        bundle_id: String,
    },
}

#[derive(Default)]
pub(crate) struct FocusTargets(Mutex<HashMap<String, FocusRoute>>);

impl FocusTargets {
    pub(crate) fn replace<T>(&self, targets: HashMap<String, T>)
    where
        T: Into<FocusRoute>,
    {
        if let Ok(mut stored) = self.0.lock() {
            *stored = targets
                .into_iter()
                .map(|(id, route)| (id, route.into()))
                .collect();
        }
    }

    fn get_route(&self, id: &str) -> Option<FocusRoute> {
        self.0.lock().ok()?.get(id).cloned()
    }
}

fn herdr_binary() -> OsString {
    crate::orchestrator::herdr_binary()
}

pub(crate) fn verify_existing_herdr_agent(pane_id: String) -> Result<(), String> {
    herdr::verify_from_environment(&pane_id)
}

fn run_focus_route(herdr: &OsString, target: &FocusRoute) -> Result<(), String> {
    match target {
        FocusRoute::Herdr {
            pane_id,
            socket,
            agent_session_id,
        } => herdr::focus(herdr, pane_id, socket.as_deref(), agent_session_id),
        FocusRoute::Application { bundle_id } => {
            #[cfg(target_os = "macos")]
            return crate::macos_app_focus::activate_running_application(bundle_id);
            #[cfg(not(target_os = "macos"))]
            Err("application focus is unavailable on this platform".to_string())
        }
    }
}

fn run_user_focus_route(herdr: &OsString, target: &FocusRoute) -> Result<(), String> {
    let FocusRoute::Herdr {
        pane_id,
        socket,
        agent_session_id,
    } = target
    else {
        return run_focus_route(herdr, target);
    };

    herdr::verify(herdr, pane_id, socket.as_deref(), agent_session_id)?;
    #[cfg(target_os = "macos")]
    let activation = crate::macos_activation::activate_herdr_host(herdr, socket.as_deref());
    let verified = herdr::verify(herdr, pane_id, socket.as_deref(), agent_session_id)?;
    let focused = herdr::focus_verified(
        herdr,
        pane_id,
        socket.as_deref(),
        agent_session_id,
        &verified,
    );
    #[cfg(target_os = "macos")]
    activation?;
    focused
}

/// CLI-only focus for the v2 bridge: switch the exact pane first so a click
/// never waits on host activation, then bring Herdr forward best-effort.
/// The interactive v1 command keeps its existing behavior below.
pub(crate) fn focus_serialized_route(route: &str) -> Result<(), String> {
    let target: FocusRoute =
        serde_json::from_str(route).map_err(|_| "focus route is invalid".to_string())?;
    let FocusRoute::Herdr {
        pane_id,
        socket,
        agent_session_id,
    } = &target
    else {
        return run_focus_route(&herdr_binary(), &target);
    };
    let herdr = herdr_binary();
    let verified = herdr::verify(&herdr, pane_id, socket.as_deref(), agent_session_id)?;
    herdr::focus_verified(
        &herdr,
        pane_id,
        socket.as_deref(),
        agent_session_id,
        &verified,
    )?;
    #[cfg(target_os = "macos")]
    let _ = crate::macos_activation::activate_herdr_host_with_timeout(
        &herdr,
        socket.as_deref(),
        std::time::Duration::from_millis(250),
    );
    Ok(())
}

pub(crate) fn focus_current_agent(id: &str) -> Result<(), String> {
    let target = crate::broker::collect()
        .focus_routes
        .remove(id)
        .ok_or_else(|| "agent is no longer available".to_string())?;
    run_user_focus_route(&herdr_binary(), &target)
}

#[tauri::command]
pub(crate) async fn focus_agent(
    id: String,
    targets: tauri::State<'_, FocusTargets>,
) -> Result<(), String> {
    let target = targets
        .get_route(&id)
        .ok_or_else(|| "agent is no longer available".to_string())?;
    let herdr = herdr_binary();
    tauri::async_runtime::spawn_blocking(move || run_user_focus_route(&herdr, &target))
        .await
        .map_err(|_| "agent focus task failed".to_string())?
}
