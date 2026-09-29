import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { appendTranscript } from "./assistant-transcript";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export class FirstmateVoice {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private starting = false;
  private listeningClaimed = false;
  private pressGeneration = 0;
  private maxTalkTimer = 0;
  private busy = false;
  private polling = 0;
  private talkPolling = 0;
  private checkingTalk = false;
  private externalTalk = false;
  private pendingReply: { text: string; offset: number } | null = null;
  private pollingNow = false;
  private awaitingReply = false;
  private awaitingSince = 0;
  private nativeWorkingSince = 0;
  private ready = false;
  private playing = false;
  private disposed = false;

  constructor(private readonly error: (reason: unknown) => void) {
    const talk = $<HTMLButtonElement>("connect");
    talk.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      talk.setPointerCapture(event.pointerId);
      void this.press();
    });
    talk.addEventListener("pointerup", () => this.release());
    talk.addEventListener("pointercancel", () => this.release());
    talk.addEventListener("keydown", (event) => {
      if ((event.key === " " || event.key === "Enter") && !event.repeat) {
        event.preventDefault();
        void this.press();
      }
    });
    talk.addEventListener("keyup", (event) => {
      if (event.key === " " || event.key === "Enter") this.release();
    });
    void listen<boolean>("orchestrator-firstmate-talk", (event) => {
      if (event.payload && !this.externalTalk) {
        this.externalTalk = true;
        void this.press();
      } else if (!event.payload && this.externalTalk) {
        this.externalTalk = false;
        if (this.starting || this.recorder?.state === "recording") this.release();
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
      if (this.disposed) return;
      this.ready = true;
      this.render();
      this.setState("Ready · hold to talk");
      this.polling = window.setInterval(() => void this.poll(), 1500);
      this.talkPolling = window.setInterval(() => void this.syncTalk(), 150);
      await this.poll();
      const generation = this.pressGeneration;
      if ((await invoke<boolean>("firstmate_talk_active")) && generation === this.pressGeneration)
        await this.press();
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
    if (this.disposed || this.checkingTalk) return;
    this.checkingTalk = true;
    try {
      const active = await invoke<boolean>("firstmate_talk_active");
      if (active && !this.externalTalk) {
        this.externalTalk = true;
        void this.press();
      } else if (!active && this.externalTalk) {
        this.externalTalk = false;
        if (this.starting || this.recorder?.state === "recording") this.release();
      }
    } catch {
      /* A later poll retries a missed bridge state. */
    } finally {
      this.checkingTalk = false;
    }
  }

  private render(): void {
    const talk = $<HTMLButtonElement>("connect");
    talk.textContent =
      this.recorder?.state === "recording"
        ? "Recording · release to send"
        : this.pendingReply && !this.playing
          ? "Reply ready · retry voice"
          : this.busy || this.awaitingReply || this.playing
            ? "Working…"
            : "Hold to talk";
    talk.disabled =
      !this.ready ||
      ((this.busy || this.awaitingReply || this.playing || this.pendingReply !== null) &&
        this.recorder === null);
    $<HTMLButtonElement>("disconnect").disabled = false;
    $<HTMLButtonElement>("cancel").disabled = true;
    $<HTMLSelectElement>("workspace").hidden = true;
  }

  private async press(): Promise<void> {
    if (
      this.disposed ||
      !this.ready ||
      this.busy ||
      this.awaitingReply ||
      this.playing ||
      this.pendingReply ||
      this.starting ||
      this.recorder
    )
      return;
    this.starting = true;
    const generation = ++this.pressGeneration;
    this.setState("Requesting microphone…");
    try {
      await invoke("begin_firstmate_listening");
      this.listeningClaimed = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (generation !== this.pressGeneration || this.disposed) {
        stream.getTracks().forEach((track) => track.stop());
        if (this.listeningClaimed) {
          this.listeningClaimed = false;
          await invoke("set_firstmate_phase", { value: "ready" });
        }
        return;
      }
      const mime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((candidate) =>
        MediaRecorder.isTypeSupported(candidate),
      );
      if (!mime) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("This microphone cannot record a supported audio format.");
      }
      this.stream = stream;
      this.chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      this.recorder = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) this.chunks.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (this.stream === stream) this.stream = null;
        void this.submit(recorder.mimeType);
      };
      recorder.start();
      this.maxTalkTimer = window.setTimeout(() => this.release(), 30_000);
      void invoke("set_orchestrator_listening", { value: true });
      this.setState("Listening");
      this.render();
    } catch (reason) {
      if (this.listeningClaimed) {
        this.listeningClaimed = false;
        void invoke("set_firstmate_phase", { value: "ready" });
      }
      this.error(reason);
      this.setState(String(reason));
    } finally {
      if (generation === this.pressGeneration) this.starting = false;
    }
  }

  private release(): void {
    this.pressGeneration++;
    this.starting = false;
    clearTimeout(this.maxTalkTimer);
    this.maxTalkTimer = 0;
    if (this.recorder?.state === "recording") {
      if (this.listeningClaimed) {
        this.listeningClaimed = false;
        void invoke("set_firstmate_phase", { value: "working" });
      }
      this.recorder.stop();
    } else {
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = null;
      if (this.listeningClaimed) {
        this.listeningClaimed = false;
        void invoke("set_firstmate_phase", { value: "ready" });
      }
    }
    void invoke("set_orchestrator_listening", { value: false });
  }

  private async submit(mime: string): Promise<void> {
    this.recorder = null;
    if (this.disposed) return;
    this.busy = true;
    this.render();
    this.setState("Transcribing…");
    try {
      const blob = new Blob(this.chunks, { type: mime });
      this.chunks = [];
      if (blob.size === 0 || blob.size > 15_000_000)
        throw new Error("Recording is empty or too long.");
      const audio = await this.toBase64(blob);
      const text = await invoke<string>("transcribe_firstmate_audio", { audio, mime });
      if (this.disposed) return;
      appendTranscript("user", text);
      this.setState("Firstmate is working…");
      await invoke("send_firstmate_text", { text });
      this.awaitingReply = true;
      this.awaitingSince = Date.now();
    } catch (reason) {
      void invoke("set_firstmate_phase", { value: "ready" });
      this.error(reason);
      this.setState(String(reason));
    } finally {
      this.busy = false;
      this.render();
    }
  }

  private toBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read microphone recording."));
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.readAsDataURL(blob);
    });
  }

  private async poll(): Promise<void> {
    if (this.disposed || this.playing || this.pollingNow || this.pendingReply) return;
    this.pollingNow = true;
    try {
      const phase = await invoke<string>("firstmate_phase");
      if (phase === "working") {
        if (!this.nativeWorkingSince) this.nativeWorkingSince = Date.now();
      } else this.nativeWorkingSince = 0;
      const reply = await invoke<{ text: string; offset: number } | null>("poll_firstmate_replies");
      if (!this.disposed && reply) {
        this.pendingReply = reply;
        void this.playNext();
      } else if (this.awaitingReply && Date.now() - this.awaitingSince > 20_000) {
        const status = await invoke<string>("firstmate_agent_status");
        if (status === "done" || status === "blocked" || status === "idle") {
          this.awaitingReply = false;
          this.render();
          this.error("Firstmate stopped without a spoken reply. Check its tab before retrying.");
        }
      } else if (this.nativeWorkingSince && Date.now() - this.nativeWorkingSince > 90_000) {
        const status = await invoke<string>("firstmate_agent_status");
        if (["done", "blocked", "idle"].includes(status)) {
          this.nativeWorkingSince = 0;
          await invoke("set_firstmate_phase", { value: "ready" });
          this.setState("Firstmate stopped without a spoken reply. Check its tab before retrying.");
        }
      }
    } catch (reason) {
      this.awaitingReply = false;
      this.render();
      this.error(reason);
    } finally {
      this.pollingNow = false;
    }
  }

  async retryVoice(): Promise<void> {
    if (this.disposed || !this.ready || this.playing) return;
    if (this.pendingReply) {
      await this.playNext();
      return;
    }
    try {
      const text = await invoke<string | null>("latest_firstmate_reply");
      if (!text) throw new Error("There is no recent Firstmate reply to replay.");
      await this.playNext(text);
    } catch (reason) {
      this.error(reason);
      this.setState(String(reason));
    }
  }

  private async playNext(replayText?: string): Promise<void> {
    if (this.playing || this.disposed) return;
    const reply = replayText ? { text: replayText, offset: null } : this.pendingReply;
    if (!reply) return;
    const { text } = reply;
    this.playing = true;
    if (!replayText) appendTranscript("assistant", text);
    let playbackError: unknown = null;
    try {
      await invoke("set_mayor_speech", { text, speaking: false });
      this.setState("Generating Mayor's voice…");
      const encoded = await invoke<string>("speak_firstmate_text", { text });
      if (this.disposed) return;
      await invoke("set_firstmate_phase", { value: "speaking" });
      await invoke("set_mayor_speech", { text, speaking: true });
      this.setState("Speaking");
      await invoke("play_firstmate_audio", { audio: encoded });
      if (reply.offset !== null) {
        await invoke("acknowledge_firstmate_reply", { offset: reply.offset });
        this.pendingReply = null;
      }
      this.awaitingReply = false;
      this.render();
    } catch (reason) {
      playbackError = reason;
      this.error(reason);
    } finally {
      if (!this.disposed) void invoke("set_mayor_speech", { text, speaking: false });
      if (!this.disposed)
        void invoke("set_firstmate_phase", { value: playbackError ? "working" : "ready" });
      this.playing = false;
      if (!this.disposed) {
        this.setState(
          playbackError ? `${String(playbackError)} · Retry voice` : "Ready · hold to talk",
        );
        this.render();
        if (!playbackError) void this.poll();
      }
    }
  }

  stop(): void {
    const canceledRecording = this.recorder?.state === "recording";
    this.disposed = true;
    this.ready = false;
    this.release();
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
