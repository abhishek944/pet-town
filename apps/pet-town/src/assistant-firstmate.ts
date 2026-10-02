import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { FirstmateRecording } from "./assistant-firstmate/recording";
import { FirstmateReplies } from "./assistant-firstmate/replies";
import { FirstmateVoiceState } from "./assistant-firstmate/state";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export class FirstmateVoice {
  private readonly state = new FirstmateVoiceState();
  private readonly recording: FirstmateRecording;
  private readonly replies: FirstmateReplies;
  private polling = 0;
  private talkPolling = 0;
  private checkingTalk = false;
  private externalTalk = false;

  constructor(private readonly error: (reason: unknown) => void) {
    const view = {
      error: (reason: unknown) => this.error(reason),
      setState: (text: string) => this.setState(text),
      render: () => this.render(),
    };
    this.recording = new FirstmateRecording(this.state, view);
    this.replies = new FirstmateReplies(this.state, view);
    const talk = $<HTMLButtonElement>("connect");
    talk.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      talk.setPointerCapture(event.pointerId);
      void this.recording.press();
    });
    talk.addEventListener("pointerup", () => this.recording.release());
    talk.addEventListener("pointercancel", () => this.recording.release());
    talk.addEventListener("keydown", (event) => {
      if ((event.key === " " || event.key === "Enter") && !event.repeat) {
        event.preventDefault();
        void this.recording.press();
      }
    });
    talk.addEventListener("keyup", (event) => {
      if (event.key === " " || event.key === "Enter") this.recording.release();
    });
    void listen<boolean>("orchestrator-firstmate-talk", (event) => {
      if (event.payload && !this.externalTalk) {
        this.externalTalk = true;
        void this.recording.press();
      } else if (!event.payload && this.externalTalk) {
        this.externalTalk = false;
        if (this.recording.active) this.recording.release();
      }
    });
    void listen("orchestrator-firstmate-retry", () => {
      void this.retryVoice();
    });
    $<HTMLButtonElement>("disconnect").addEventListener("click", () => {
      this.stop();
      void getCurrentWindow().close();
    });
    this.render();
  }

  async activate(): Promise<void> {
    try {
      await invoke("start_firstmate");
      if (this.state.disposed) return;
      this.state.ready = true;
      this.render();
      this.setState("Ready · hold to talk");
      this.polling = window.setInterval(() => void this.replies.poll(), 1500);
      this.talkPolling = window.setInterval(() => void this.syncTalk(), 150);
      await this.replies.poll();
      const generation = this.recording.generation;
      if (
        (await invoke<boolean>("firstmate_talk_active")) &&
        generation === this.recording.generation
      )
        await this.recording.press();
    } catch (reason) {
      this.error(reason);
      this.setState(String(reason));
    }
  }

  private setState(text: string): void {
    $("connection").textContent = text;
    $("voice-state").textContent = text;
    void invoke("set_mayor_voice_status", { status: text });
  }

  private async syncTalk(): Promise<void> {
    if (this.state.disposed || this.checkingTalk) return;
    this.checkingTalk = true;
    try {
      const active = await invoke<boolean>("firstmate_talk_active");
      if (active && !this.externalTalk) {
        this.externalTalk = true;
        void this.recording.press();
      } else if (!active && this.externalTalk) {
        this.externalTalk = false;
        if (this.recording.active) this.recording.release();
      }
    } catch {
      /* A later poll retries a missed bridge state. */
    } finally {
      this.checkingTalk = false;
    }
  }

  private render(): void {
    const talk = $<HTMLButtonElement>("connect");
    talk.textContent = this.recording.isRecording
      ? "Recording · release to send"
      : this.state.pendingReply && !this.state.playing
        ? "Reply ready · retry voice"
        : this.state.busy || this.state.awaitingReply || this.state.playing
          ? "Working…"
          : "Hold to talk";
    talk.disabled =
      !this.state.ready ||
      ((this.state.busy ||
        this.state.awaitingReply ||
        this.state.playing ||
        this.state.pendingReply !== null) &&
        !this.recording.hasRecorder);
    $<HTMLButtonElement>("disconnect").disabled = false;
    $<HTMLButtonElement>("cancel").disabled = true;
  }

  retryVoice(): Promise<void> {
    return this.replies.retryVoice();
  }

  stop(): void {
    const canceledRecording = this.recording.isRecording;
    this.state.disposed = true;
    this.state.ready = false;
    this.recording.release();
    clearInterval(this.polling);
    clearInterval(this.talkPolling);
    void invoke("stop_firstmate_audio");
    void invoke("set_mayor_speech", { text: "", speaking: false });
    if (canceledRecording) void invoke("set_firstmate_phase", { value: "ready" });
    else
      void invoke<string>("firstmate_phase").then((phase) => {
        if (phase === "speaking" || phase === "listening") {
          return invoke("set_firstmate_phase", { value: "ready" });
        }
      });
    this.setState("Voice stopped");
    this.render();
  }
}
