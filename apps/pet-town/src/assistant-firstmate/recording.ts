import { invoke } from "@tauri-apps/api/core";
import { appendTranscript } from "../assistant-transcript";
import type { FirstmateVoiceState, FirstmateVoiceView } from "./state";

export class FirstmateRecording {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private starting = false;
  private listeningClaimed = false;
  private pressGeneration = 0;
  private maxTalkTimer = 0;

  constructor(
    private readonly state: FirstmateVoiceState,
    private readonly view: FirstmateVoiceView,
  ) {}

  get generation(): number {
    return this.pressGeneration;
  }

  get isRecording(): boolean {
    return this.recorder?.state === "recording";
  }

  get hasRecorder(): boolean {
    return this.recorder !== null;
  }

  get active(): boolean {
    return this.starting || this.isRecording;
  }

  async press(): Promise<void> {
    if (
      this.state.disposed ||
      !this.state.ready ||
      this.state.busy ||
      this.state.awaitingReply ||
      this.state.playing ||
      this.state.pendingReply ||
      this.starting ||
      this.recorder
    )
      return;
    this.starting = true;
    const generation = ++this.pressGeneration;
    this.view.setState("Requesting microphone…");
    try {
      await invoke("begin_firstmate_listening");
      this.listeningClaimed = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (generation !== this.pressGeneration || this.state.disposed) {
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
      this.view.setState("Listening");
      this.view.render();
    } catch (reason) {
      if (this.listeningClaimed) {
        this.listeningClaimed = false;
        void invoke("set_firstmate_phase", { value: "ready" });
      }
      this.view.error(reason);
      this.view.setState(String(reason));
    } finally {
      if (generation === this.pressGeneration) this.starting = false;
    }
  }

  release(): void {
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
    if (this.state.disposed) return;
    this.state.busy = true;
    this.view.render();
    this.view.setState("Transcribing…");
    try {
      const blob = new Blob(this.chunks, { type: mime });
      this.chunks = [];
      if (blob.size === 0 || blob.size > 15_000_000)
        throw new Error("Recording is empty or too long.");
      const audio = await this.toBase64(blob);
      const text = await invoke<string>("transcribe_firstmate_audio", { audio, mime });
      if (this.state.disposed) return;
      appendTranscript("user", text);
      this.view.setState("Firstmate is working…");
      await invoke("send_firstmate_text", { text });
      this.state.awaitingReply = true;
      this.state.awaitingSince = Date.now();
    } catch (reason) {
      void invoke("set_firstmate_phase", { value: "ready" });
      this.view.error(reason);
      this.view.setState(String(reason));
    } finally {
      this.state.busy = false;
      this.view.render();
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
}
