use std::io::{Cursor, Read};
use std::path::Path;

// The installed Tauri CLI does not yet put the version in its signature comment.
// Bind the feed to metadata INSIDE the verified archive, not its unsigned JSON.
pub(super) fn validate(bytes: &[u8], version: &str, identifier: &str) -> Result<(), String> {
    let mut archive = tar::Archive::new(flate2::read::GzDecoder::new(bytes));
    let mut metadata = false;
    let mut executable = false;
    for entry in archive.entries().map_err(|error| error.to_string())? {
        let mut entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path().map_err(|error| error.to_string())?;
        let path = path.strip_prefix(".").unwrap_or(&path);
        if path == Path::new("Pet Town.app/Contents/Info.plist") {
            if !entry.header().entry_type().is_file() || entry.size() > 1024 * 1024 {
                return Err("The updater archive has invalid app metadata.".into());
            }
            let mut plist_bytes = Vec::new();
            entry
                .read_to_end(&mut plist_bytes)
                .map_err(|error| error.to_string())?;
            let plist = plist::Value::from_reader(Cursor::new(plist_bytes))
                .map_err(|error| error.to_string())?;
            let dictionary = plist
                .as_dictionary()
                .ok_or("App metadata is not a dictionary.")?;
            let field = |name| dictionary.get(name).and_then(plist::Value::as_string);
            if field("CFBundleShortVersionString") != Some(version)
                || field("CFBundleIdentifier") != Some(identifier)
            {
                return Err("The signed app does not match the announced Pet Town version.".into());
            }
            metadata = true;
        } else if path == Path::new("Pet Town.app/Contents/MacOS/pet-town") {
            let mut header = [0; 8];
            entry
                .read_exact(&mut header)
                .map_err(|error| error.to_string())?;
            let cpu = u32::from_le_bytes(header[4..8].try_into().unwrap());
            let expected = match std::env::consts::ARCH {
                "aarch64" => 0x0100000c,
                "x86_64" => 0x01000007,
                _ => {
                    return Err(
                        "App updates currently support Apple Silicon and Intel Macs.".into(),
                    )
                }
            };
            // ponytail: matrix builds single-arch Mach-O; add fat support if releases become universal.
            if header[..4] != [0xcf, 0xfa, 0xed, 0xfe] || cpu != expected {
                return Err("The signed app does not match this Mac's architecture.".into());
            }
            executable = true;
        }
        if metadata && executable {
            return Ok(());
        }
    }
    Err("The updater archive is missing Pet Town app metadata or its executable.".into())
}
