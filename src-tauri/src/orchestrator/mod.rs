mod agent;
mod agent_cleanup;
mod agent_launch;
mod agent_response;
pub mod commands;
mod commentary;
mod herdr;
mod herdr_io;
mod launch;
mod launch_replace;
mod launcher;
pub(crate) mod openai;
mod runtime;
mod runtime_install;
mod runtime_verify;
mod state;
pub mod status_commands;
pub mod task_commands;
mod task_dispatch;
mod wake;
mod window;

pub use state::OrchestratorState;
pub(crate) fn herdr_binary() -> std::ffi::OsString {
    herdr::binary()
}

pub fn retry_exit(app: tauri::AppHandle) {
    use tauri::Manager;
    let (agent, ready) = {
        let state = app.state::<OrchestratorState>();
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        if runtime.exit_cleanup_running {
            return;
        }
        let ready = runtime.agent.is_none() && runtime.cleanup_count == 0;
        if runtime.agent.is_some() {
            runtime.exit_cleanup_running = true;
            runtime.cleanup_count += 1;
        }
        (runtime.agent.clone(), ready)
    };
    if ready {
        app.exit(0);
        return;
    }
    let Some(agent) = agent else { return };
    tauri::async_runtime::spawn(async move {
        let _ = tauri::async_runtime::spawn_blocking(move || loop {
            match agent.try_close() {
                Ok(()) => break,
                Err(error) if agent_response::terminal_missing(&error) => break,
                Err(_) => std::thread::sleep(std::time::Duration::from_secs(1)),
            }
        })
        .await;
        let state = app.state::<OrchestratorState>();
        let mut runtime = state.0.lock().unwrap_or_else(|error| error.into_inner());
        runtime.agent = None;
        runtime.active_task_id = None;
        runtime.exit_cleanup_running = false;
        runtime.cleanup_count = runtime.cleanup_count.saturating_sub(1);
        drop(runtime);
        app.exit(0);
    });
}

pub fn prepare_exit(app: &tauri::AppHandle) {
    use tauri::Emitter;
    wake::stop(app);
    let _ = app.emit_to("orchestrator", "orchestrator-exit", ());
}
