use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

/// Image-hosting windows must disable WebKit's retaining async decoder queues before loading.
pub(crate) fn builder<'a>(
    app: &'a AppHandle,
    label: &str,
    url: WebviewUrl,
) -> Result<WebviewWindowBuilder<'a, tauri::Wry, AppHandle>, String> {
    let builder = WebviewWindowBuilder::new(app, label, url);
    #[cfg(target_os = "macos")]
    let builder = {
        use objc2_web_kit::WKWebViewConfiguration;
        use tauri_nspanel::objc2::{msg_send, sel, MainThreadMarker};

        let main = MainThreadMarker::new()
            .ok_or("Image windows must be constructed on the main thread")?;
        // Guard private selectors rather than risking an unknown KVC key or silent fallback.
        let configuration = unsafe { WKWebViewConfiguration::new(main) };
        let preferences = unsafe { configuration.preferences() };
        for selector in [
            sel!(_setAnimatedImageAsyncDecodingEnabled:),
            sel!(_animatedImageAsyncDecodingEnabled),
            sel!(_setLargeImageAsyncDecodingEnabled:),
            sel!(_largeImageAsyncDecodingEnabled),
        ] {
            let supported: bool = unsafe { msg_send![&*preferences, respondsToSelector: selector] };
            if !supported {
                return Err("This WebKit cannot configure safe image decoding".into());
            }
        }
        unsafe {
            let _: () = msg_send![&*preferences, _setAnimatedImageAsyncDecodingEnabled: false];
            let _: () = msg_send![&*preferences, _setLargeImageAsyncDecodingEnabled: false];
            let animated: bool = msg_send![&*preferences, _animatedImageAsyncDecodingEnabled];
            let large: bool = msg_send![&*preferences, _largeImageAsyncDecodingEnabled];
            if animated || large {
                return Err("WebKit did not accept safe image decoding preferences".into());
            }
        }
        eprintln!(
            "Image decoding preferences stored for {label}: animatedAsync=false largeAsync=false"
        );
        builder.with_webview_configuration(configuration)
    };
    Ok(builder)
}
