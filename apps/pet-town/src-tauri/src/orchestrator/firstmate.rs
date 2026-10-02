//! The Firstmate primary agent is a separate, persistent Pi session in the selected checkout.
//! Only completed assistant text from Pi's structured session log is exposed to speech.
mod audio;
mod binding;
mod commands;
mod configuration;
mod ownership;
mod replies;
mod session;
mod startup;
mod voice_state;

// Keep Tauri command functions and their generated macros at the existing public paths.
pub use audio::*;
pub use commands::*;
use configuration::configured;
pub use ownership::close;
use ownership::persist;
use serde::{Deserialize, Serialize};
use std::{
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, AtomicU8},
        Mutex,
    },
};
use tauri::AppHandle;
pub use voice_state::*;

#[derive(Default)]
pub struct FirstmateState(
    pub Mutex<FirstmateSession>,
    pub Mutex<()>,
    pub AtomicBool,
    pub AtomicBool,
    pub AtomicU8,
);

pub const READY: u8 = 0;
pub const LISTENING: u8 = 1;
pub const WORKING: u8 = 2;
pub const SPEAKING: u8 = 3;

#[derive(Clone, Default, Deserialize, Serialize)]
pub struct FirstmateSession {
    path: String,
    tab: String,
    pane: String,
    agent: String,
    log: PathBuf,
    offset: u64,
    #[serde(default)]
    session_token: String,
    model: String,
    thinking: String,
    #[serde(default)]
    home: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FirstmateReply {
    pub(crate) text: String,
    pub(crate) offset: u64,
    pub(crate) session_token: String,
}

/// The cursor advances only after the view acknowledges this binding's displayed reply.
#[tauri::command]
pub async fn poll_firstmate_replies(app: AppHandle) -> Result<Option<FirstmateReply>, String> {
    binding::with_current(app, replies::poll).await
}

#[tauri::command]
pub async fn acknowledge_firstmate_reply(
    offset: u64,
    session_token: String,
    app: AppHandle,
) -> Result<(), String> {
    binding::with_current(app, move |session| {
        replies::acknowledge(session, offset, &session_token)
    })
    .await
}

#[tauri::command]
pub async fn latest_firstmate_reply(app: AppHandle) -> Result<Option<String>, String> {
    binding::with_current(app, replies::latest).await
}
