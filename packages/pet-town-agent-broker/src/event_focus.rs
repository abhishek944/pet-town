use crate::FocusRoute;

pub(crate) fn route(
    source: &str,
    thread_id: Option<String>,
    fallback_bundle_id: Option<String>,
) -> Option<FocusRoute> {
    if source == "codex" {
        Some(FocusRoute::Codex {
            thread_id,
            fallback_bundle_id,
        })
    } else {
        fallback_bundle_id.map(|bundle_id| FocusRoute::Application { bundle_id })
    }
}
