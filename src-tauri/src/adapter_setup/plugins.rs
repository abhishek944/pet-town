use super::files::{
    read_regular_file, remove_conditionally, settings_path, with_file_lock, write_atomic,
    write_private_backup, FILE_MARKER, MANAGED_MARKER,
};
fn has_managed_header(text: &str) -> bool {
    text.starts_with(&format!("// {FILE_MARKER}\n"))
}

fn source(source: &str) -> Result<String, String> {
    let binary = std::env::current_exe()
        .map_err(|_| "could not locate the installed application".to_string())?;
    let binary = serde_json::to_string(&binary.to_string_lossy())
        .map_err(|_| "could not encode the installed application path".to_string())?;
    let epoch = crate::adapter_events::source_epoch(source)
        .ok_or_else(|| "adapter installation identity is unavailable".to_string())?;
    let common = format!(
        "// {FILE_MARKER}\nimport {{ spawn }} from \"node:child_process\";\nimport {{ randomUUID }} from \"node:crypto\";\nconst binary = {binary};\nconst processSession = randomUUID();\nfunction send(event, sessionId, cwd) {{\n  try {{\n    const boundary = event === \"session_start\" || event === \"session_end\";\n    const child = spawn(binary, [\"--adapter-event\", \"{source}\", event, \"{MANAGED_MARKER}\", \"{epoch}\"], {{ detached: !boundary, stdio: [\"pipe\", \"ignore\", \"ignore\"] }});\n    child.stdin.on(\"error\", () => {{}});\n    child.stdin.end(JSON.stringify({{ session_id: sessionId || processSession, cwd: cwd || process.cwd(), _agent_pets_generation: processSession }}));\n    if (!boundary) {{ child.on(\"error\", () => {{}}); child.unref(); return Promise.resolve(); }}\n    return new Promise((resolve) => {{ child.on(\"error\", resolve); child.on(\"close\", resolve); }});\n  }} catch {{ return Promise.resolve(); }}\n}}\n"
    );
    if source == "pi" {
        return Ok(format!(
            "{common}\nexport default function (pi) {{\n  const details = (ctx) => [ctx.sessionManager.getSessionFile?.() || ctx.sessionManager.getSessionId?.() || processSession, ctx.cwd];\n  const emit = (event, ctx) => send(event, ...details(ctx));\n  pi.on(\"session_start\", (_event, ctx) => emit(\"session_start\", ctx));\n  pi.on(\"input\", (_event, ctx) => emit(\"activity\", ctx));\n  pi.on(\"agent_start\", (_event, ctx) => emit(\"activity\", ctx));\n  pi.on(\"tool_execution_start\", (_event, ctx) => emit(\"activity\", ctx));\n  pi.on(\"ui_prompt_start\", (_event, ctx) => emit(\"user_input\", ctx));\n  pi.on(\"ui_prompt_end\", (_event, ctx) => emit(\"activity\", ctx));\n  pi.on(\"agent_settled\", (_event, ctx) => emit(\"stop\", ctx));\n  pi.on(\"session_shutdown\", (_event, ctx) => emit(\"session_end\", ctx));\n}}\n"
        ));
    }
    Ok(format!(
        "{common}\nfunction sessionId(value) {{\n  const p = value?.properties || value || {{}};\n  return p.sessionID || p.sessionId || p.session_id || p.info?.id || p.session?.id || null;\n}}\nexport const AgentPetsPlugin = async (context) => {{\n  const projectDirectory = typeof context?.directory === \"string\" ? context.directory : process.cwd();\n  const sessions = new Set();\n  const emit = (event, value) => {{ const id = typeof value === \"string\" ? value : sessionId(value); if (!id) return Promise.resolve(); if (event === \"session_end\") sessions.delete(id); else sessions.add(id); return send(event, id, projectDirectory); }};\n  return {{\n    event: async (input) => {{\n      const type = input?.event?.type || \"activity\";\n      const status = input?.event?.properties?.status?.type || input?.event?.properties?.status;\n      const event = type === \"session.created\" ? \"session_start\" : type === \"session.deleted\" ? \"session_end\" : type === \"session.idle\" || (type === \"session.status\" && status === \"idle\") || type === \"session.error\" ? \"stop\" : type === \"permission.asked\" || type === \"permission.v2.asked\" || type === \"question.asked\" || type === \"question.v2.asked\" ? \"permission_request\" : type.startsWith(\"session.\") ? \"activity\" : null;\n      if (event) await emit(event, input?.event);\n    }},\n    \"tool.execute.before\": async (input) => emit(\"activity\", input),\n    \"tool.execute.after\": async (input) => emit(\"activity\", input),\n    dispose: async () => {{ for (const id of sessions) await send(\"session_end\", id, projectDirectory); sessions.clear(); }}\n  }};\n}};\n"
    ))
}

pub(super) fn status(source_name: &str) -> &'static str {
    let Ok(path) = settings_path(source_name) else {
        return "error";
    };
    let bytes = match read_regular_file(&path, "adapter plugin") {
        Ok(Some(bytes)) => bytes,
        Ok(None) => return "notInstalled",
        Err(_) => return "error",
    };
    let Ok(text) = String::from_utf8(bytes) else {
        return "error";
    };
    let Ok(expected) = source(source_name) else {
        return if has_managed_header(&text) {
            "needsUpdate"
        } else {
            "conflict"
        };
    };
    if text == expected {
        "installed"
    } else if has_managed_header(&text) {
        "needsUpdate"
    } else {
        "conflict"
    }
}

pub(super) fn configure(source_name: &str, enabled: bool) -> Result<(), String> {
    let path = settings_path(source_name)?;
    with_file_lock(&path, "adapter plugin", || {
        if !enabled {
            let Some(bytes) = read_regular_file(&path, "adapter plugin")? else {
                return Ok(());
            };
            let text = std::str::from_utf8(&bytes)
                .map_err(|_| "adapter plugin is not valid UTF-8".to_string())?;
            if !has_managed_header(&text) {
                return Err("the adapter plugin path is owned by another file".to_string());
            }
            write_private_backup(&path, &bytes, "adapter plugin")?;
            remove_conditionally(&path, &bytes, "adapter plugin")?;
            return Ok(());
        }
        let original = read_regular_file(&path, "adapter plugin")?;
        if let Some(bytes) = original.as_ref() {
            let text = String::from_utf8(bytes.clone())
                .map_err(|_| "adapter plugin is not valid UTF-8".to_string())?;
            if !has_managed_header(&text) {
                return Err("the adapter plugin path is already in use".to_string());
            }
        }
        write_atomic(
            &path,
            source(source_name)?.as_bytes(),
            original.as_deref(),
            "adapter plugin",
        )
    })
}
