# Orchestrator flow

**User goal:** Wake the mayor and use one trusted Firstmate primary agent in either voice mode.

```text
Standard mode (default): wake/focus → hold to talk → OpenAI transcription
  → selected Firstmate checkout's dedicated Pi primary session
  → user-facing Firstmate text → OpenAI speech + Mayor bubble
Live mode: wake → GPT-Live speech → Responses tools → the same Firstmate primary
```

Both modes require selecting and explicitly trusting an existing Firstmate checkout in Mayor settings. The dedicated Mayor primary uses an isolated `FM_HOME` under Pet Town preferences, so it does not take over the checkout's separately running Firstmate session. In Standard mode, wake phrase and Option+M focus the Mayor; neither starts recording or opens a separate conversation window. In Live mode, either starts the GPT-Live voice conversation. Hold **Control+Option** together in any window and release either key to send, or click **Start talking** and **Stop and send** in the town. The desktop app reads macOS modifier state across windows and captures audio through its native microphone recorder. Mayor settings also has a **Hold to talk** button. A completed utterance is transcribed with OpenAI and sent as text to the Firstmate primary session. In Standard mode, only completed assistant text (not tool output) is spoken and shown in the town; later user-facing replies are read from that primary session while the background voice runtime is active. The owned session ID and acknowledged reply cursor are stored locally so replies can be picked up when the window is reopened, including after an app restart; the primary Herdr tab survives an app quit so ongoing work is not interrupted. In Standard mode, the reply cursor advances after speech playback succeeds. In Live mode, it advances after the completed Firstmate reply is delivered to GPT-Live. If audio generation or playback fails, **Retry voice** appears in the 3D town and can replay the latest completed reply. OpenAI speech services are billed separately from Pi. A speech or agent failure stays in Standard mode, shows an error, and never silently switches to Live mode. Switching modes ends the outgoing voice window but does not cancel Firstmate work in progress.

The dedicated Firstmate primary keeps its Herdr tab and pane but is represented by the Mayor pet in both towns while Mayor is enabled. Its exact saved pane and Pi session identity are excluded from the ordinary agent roster; other Firstmate sessions and any agents the Mayor spawns remain separate pets. Mayor has one voice phase at a time: ready, listening, working, or speaking. A new recording is rejected while Mayor is working or speaking.

The steps below describe **Live mode**:

1. When enabled in Settings, the desktop app starts an on-device listener for the configured assistant name. Hearing the wake phrase activates a new conversation. In the 3D town, Option+M also calls the Mayor and focuses its pet; both entry points use the same voice session path.
2. The desktop app reconnects the selected Firstmate primary and negotiates a GPT-Live session with Responses backend tools. These startup operations can run concurrently. The assistant's UI reports listening or connection status, and spoken output is published to the 3D town for its Mayor speech bubble. If the tools session cannot connect, voice remains disconnected and shows the error for a retry.
3. Simple conversational responses stay in the voice conversation. Requests needing computer work are sent to the same Firstmate primary in its dedicated Herdr pane. The assistant waits for a reported result before saying the work is complete. Completed Firstmate replies are returned to the Responses backend; if no Mayor speech follows, a short verified result is sent to the live commentary channel after ten seconds.
4. A spoken cancellation interrupts the current Firstmate request. Ending the conversation closes that voice session; the wake listener can remain available for the next phrase when enabled.
5. Applying a Firstmate folder or model change reconnects its dedicated primary. Live conversation instructions apply to GPT-Live and its Responses backend; the selected checkout supplies Firstmate instructions. Unrelated settings do not restart wake recognition. Starting Mayor arms wake listening before Firstmate launches.

The Mayor settings can save an OpenAI API key in macOS Keychain or import an existing `OPENAI_API_KEY` from `~/.zshrc`. The key is never stored in preferences. Pet Town checks Keychain first, then its launch environment, so a desktop launch works after the one-time save or import. A successful Keychain read is reused for the current app process, avoiding repeated prompts during status refreshes. The debug app uses a stable Apple Development signature when one is available so macOS can remember a user's Keychain approval across rebuilds.

GPT-Live and its Responses tool backend receive the application-provided instructions: `Your name: <saved display name>` followed on the next line by the exact system prompt saved in Settings. The Firstmate primary instead uses its selected checkout and isolated `FM_HOME`.

The GPT-Live Responses backend uses GPT-5.6 Luna with medium reasoning and the `priority` service tier, which selects Fast mode when available to the OpenAI project. Fast processing has a higher per-token price than Standard processing. This setting does not change the GPT-Live voice model or the selected Firstmate model.

**Other outcomes:** If wake recognition, the local runtime, Herdr, or voice session startup fails, show the actual error and leave the assistant ready for a later retry when possible. A failed or unfinished Firstmate result must be reported as such. Closing a Live voice session leaves Firstmate work running in its owned pane; a pending reply is retained for Standard mode if it could not be delivered to Live.

**Implementation:** [Desktop architecture](../README.md#architecture) and the Rust orchestrator under `apps/pet-town/src-tauri/src/orchestrator/`.
