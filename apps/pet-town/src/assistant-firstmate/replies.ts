import { invoke } from "@tauri-apps/api/core";
import { appendTranscript } from "../assistant-transcript";
import type { FirstmateReply, FirstmateVoiceState, FirstmateVoiceView } from "./state";

export class FirstmateReplies {
  private pollingNow = false;
  private nativeWorkingSince = 0;

  constructor(
    private readonly state: FirstmateVoiceState,
    private readonly view: FirstmateVoiceView,
  ) {}

  async poll(): Promise<void> {
    if (this.state.disposed || this.state.playing || this.pollingNow || this.state.pendingReply)
      return;
    this.pollingNow = true;
    try {
      const phase = await invoke<string>("firstmate_phase");
      if (phase === "working") {
        if (!this.nativeWorkingSince) this.nativeWorkingSince = Date.now();
      } else this.nativeWorkingSince = 0;
      const reply = await invoke<FirstmateReply | null>("poll_firstmate_replies");
      if (!this.state.disposed && reply) {
        this.state.pendingReply = reply;
        void this.playNext();
      } else if (this.state.awaitingReply && Date.now() - this.state.awaitingSince > 20_000) {
        const status = await invoke<string>("firstmate_agent_status");
        if (status === "done" || status === "blocked" || status === "idle") {
          this.state.awaitingReply = false;
          this.view.render();
          this.view.error(
            "Firstmate stopped without a spoken reply. Check its tab before retrying.",
          );
        }
      } else if (this.nativeWorkingSince && Date.now() - this.nativeWorkingSince > 90_000) {
        const status = await invoke<string>("firstmate_agent_status");
        if (["done", "blocked", "idle"].includes(status)) {
          this.nativeWorkingSince = 0;
          await invoke("set_firstmate_phase", { value: "ready" });
          this.view.setState(
            "Firstmate stopped without a spoken reply. Check its tab before retrying.",
          );
        }
      }
    } catch (reason) {
      this.state.awaitingReply = false;
      this.view.render();
      this.view.error(reason);
    } finally {
      this.pollingNow = false;
    }
  }

  async retryVoice(): Promise<void> {
    if (this.state.disposed || !this.state.ready || this.state.playing) return;
    if (this.state.pendingReply) {
      await this.playNext();
      return;
    }
    try {
      const text = await invoke<string | null>("latest_firstmate_reply");
      if (!text) throw new Error("There is no recent Firstmate reply to replay.");
      await this.playNext(text);
    } catch (reason) {
      this.view.error(reason);
      this.view.setState(String(reason));
    }
  }

  private async playNext(replayText?: string): Promise<void> {
    if (this.state.playing || this.state.disposed) return;
    const reply = replayText ? null : this.state.pendingReply;
    const text = replayText || reply?.text;
    if (!text) return;
    this.state.playing = true;
    if (!replayText) appendTranscript("assistant", text);
    let playbackError: unknown = null;
    let acknowledgingReply = false;
    let replySessionChanged = false;
    try {
      await invoke("set_mayor_speech", { text, speaking: false });
      this.view.setState("Generating Mayor's voice…");
      const encoded = await invoke<string>("speak_firstmate_text", { text });
      if (this.state.disposed) return;
      await invoke("set_firstmate_phase", { value: "speaking" });
      await invoke("set_mayor_speech", { text, speaking: true });
      this.view.setState("Speaking");
      await invoke("play_firstmate_audio", { audio: encoded });
      if (reply) {
        acknowledgingReply = true;
        await invoke("acknowledge_firstmate_reply", {
          offset: reply.offset,
          sessionToken: reply.sessionToken,
        });
        this.state.pendingReply = null;
      }
      this.state.awaitingReply = false;
      this.view.render();
    } catch (reason) {
      playbackError = reason;
      replySessionChanged =
        acknowledgingReply &&
        String(reason) === "Firstmate session changed before this reply could be acknowledged.";
      if (replySessionChanged) {
        this.state.pendingReply = null;
        this.state.awaitingReply = false;
      }
      this.view.error(reason);
    } finally {
      if (!this.state.disposed) void invoke("set_mayor_speech", { text, speaking: false });
      if (!this.state.disposed)
        void invoke("set_firstmate_phase", {
          value: playbackError && !replySessionChanged ? "working" : "ready",
        });
      this.state.playing = false;
      if (!this.state.disposed) {
        this.view.setState(
          playbackError
            ? `${String(playbackError)}${replySessionChanged ? "" : " · Retry voice"}`
            : "Ready · hold to talk",
        );
        this.view.render();
        if (!playbackError || replySessionChanged) void this.poll();
      }
    }
  }
}
