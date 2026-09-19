pub(crate) fn launched_from_app_bundle() -> bool {
    std::env::current_exe()
        .ok()
        .as_deref()
        .is_some_and(|executable| {
            executable
                .ancestors()
                .any(|path| path.extension().is_some_and(|extension| extension == "app"))
        })
}
