#[test]
#[ignore = "Requires network access; sends no credentials or audio"]
fn voice_endpoint_transport() {
    tauri::async_runtime::block_on(async {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(15))
            .build()
            .unwrap();
        let response = client
            .head("https://api.openai.com/v1/live/sessions")
            .send()
            .await;
        assert!(response.is_ok(), "Voice transport: {response:?}");
    });
}
