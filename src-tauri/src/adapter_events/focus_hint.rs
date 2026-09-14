pub(super) fn focus_application(source: &str) -> Option<String> {
    if source == "cursor" {
        return Some("com.todesktop.230313mzl4w4u92".to_string());
    }
    let terminal = std::env::var("TERM_PROGRAM").ok()?;
    let bundle = match terminal.as_str() {
        "Apple_Terminal" => "com.apple.Terminal",
        "iTerm.app" => "com.googlecode.iterm2",
        "vscode" => "com.microsoft.VSCode",
        "WarpTerminal" => "dev.warp.Warp-Stable",
        "ghostty" => "com.mitchellh.ghostty",
        "WezTerm" => "com.github.wez.wezterm",
        _ => return None,
    };
    Some(bundle.to_string())
}
