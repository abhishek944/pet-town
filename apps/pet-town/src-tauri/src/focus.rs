mod herdr;

pub(crate) use crate::focus_id::{herdr_owner_key, public_agent_id};
use std::ffi::OsString;

#[derive(Clone, Debug)]
pub(crate) enum FocusRoute {
    Herdr {
        pane_id: String,
        socket: Option<String>,
        agent_session_id: String,
    },
    Application {
        bundle_id: String,
    },
    Codex {
        thread_id: Option<String>,
        fallback_bundle_id: Option<String>,
    },
}

impl From<pet_town_agent_broker::FocusRoute> for FocusRoute {
    fn from(route: pet_town_agent_broker::FocusRoute) -> Self {
        match route {
            pet_town_agent_broker::FocusRoute::Herdr {
                pane_id,
                socket,
                agent_session_id,
            } => Self::Herdr {
                pane_id,
                socket,
                agent_session_id,
            },
            pet_town_agent_broker::FocusRoute::Application { bundle_id } => {
                Self::Application { bundle_id }
            }
            pet_town_agent_broker::FocusRoute::Codex {
                thread_id,
                fallback_bundle_id,
            } => Self::Codex {
                thread_id,
                fallback_bundle_id,
            },
        }
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
        FocusRoute::Codex {
            thread_id,
            fallback_bundle_id,
        } => pet_town_agent_broker::focus_route(&pet_town_agent_broker::FocusRoute::Codex {
            thread_id: thread_id.clone(),
            fallback_bundle_id: fallback_bundle_id.clone(),
        }),
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

    let verified = herdr::verify(herdr, pane_id, socket.as_deref(), agent_session_id)?;
    herdr::focus_verified(
        herdr,
        pane_id,
        socket.as_deref(),
        agent_session_id,
        &verified,
    )?;
    // Select the pane before exposing the terminal window to avoid showing its
    // previously selected workspace during the app switch.
    #[cfg(target_os = "macos")]
    crate::macos_activation::activate_herdr_host(herdr, socket.as_deref())?;
    Ok(())
}

pub(crate) fn focus_current_agent(id: &str) -> Result<(), String> {
    let target = crate::sessions::collect_visible()
        .focus_routes
        .remove(id)
        .map(FocusRoute::from)
        .ok_or_else(|| "agent is no longer available".to_string())?;
    if let FocusRoute::Codex {
        thread_id,
        fallback_bundle_id,
    } = &target
    {
        let activated = pet_town_agent_broker::focus_route_with_codex_activation(
            &pet_town_agent_broker::FocusRoute::Codex {
                thread_id: thread_id.clone(),
                fallback_bundle_id: fallback_bundle_id.clone(),
            },
        )?;
        if activated {
            crate::adapter_events::mark_codex_idle(id)?;
        }
        return Ok(());
    }
    run_user_focus_route(&herdr_binary(), &target)
}

#[tauri::command]
pub(crate) async fn focus_agent(id: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || focus_current_agent(&id))
        .await
        .map_err(|_| "agent focus task failed".to_string())?
}
