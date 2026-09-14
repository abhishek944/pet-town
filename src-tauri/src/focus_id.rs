fn opaque(value: &str) -> String {
    let mut hash = 0xcbf29ce484222325_u64;
    for byte in value.as_bytes() {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{hash:016x}")
}

pub(crate) fn public_agent_id(socket: Option<&str>, agent_session_id: &str) -> String {
    let namespace = socket.map(opaque).unwrap_or_else(|| "default".to_string());
    format!("herdr:{namespace}:{}", opaque(agent_session_id))
}

pub(crate) fn herdr_owner_key(socket: Option<&str>, agent_session_id: &str) -> String {
    let namespace = socket.map(opaque).unwrap_or_else(|| "default".to_string());
    format!("herdr-session:{namespace}:{}", opaque(agent_session_id))
}
