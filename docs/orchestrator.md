# Orchestrator flow

**User goal:** Wake the assistant, talk to it, and delegate computer work to the local Pi agent.

```text
Local wake listener
  → voice session in the desktop app
  → GPT-Live conversation
  → task delegation when computer work is needed
  → Pi agent in a dedicated Herdr pane
  → verified task result spoken back to the user
```

1. When enabled in Settings, the desktop app starts an on-device listener for the configured assistant name. Hearing the wake phrase activates a new conversation. The 3D town can also focus its mayor when a wake event arrives.
2. The desktop app starts Pi and negotiates the GPT-Live voice connection. These startup operations can run concurrently. The assistant's UI reports listening or connection status.
3. Simple conversational responses stay in the voice conversation. Requests needing computer work are delegated to Pi in its dedicated Herdr pane. The assistant waits for a reported result before saying the work is complete.
4. A spoken cancellation asks the task path to cancel current Pi work. Ending the conversation closes that voice session; the wake listener can remain available for the next phrase when enabled.

**Other outcomes:** If wake recognition, the local runtime, Herdr, or voice session startup fails, show the actual error and leave the assistant ready for a later retry when possible. A failed or unfinished Pi result must be reported as such.

**Implementation:** [Desktop architecture](../README.md#architecture) and the Rust orchestrator under `apps/pet-town/src-tauri/src/orchestrator/`.
