import { invoke } from "@tauri-apps/api/core";
import { isMayorWake } from "./assistant-status";
import { appendTranscript, resetTranscript } from "./assistant-transcript";
import { TownSpeech } from "./assistant-town-speech";
import type { LiveEvent } from "./assistant-tasks";

export class LiveTranscripts {
  private userUtterance = "";
  private lastInputAt = 0;
  private mayorName = "Mayor";
  private readonly townSpeech = new TownSpeech();

  setMayorName(name: string): void {
    this.mayorName = name;
  }

  handle(event: LiveEvent, resetIdle: () => void, maybeCancel: (utterance: string) => void): void {
    if (event.type === "session.input_transcript.delta" && event.delta) {
      resetIdle();
      this.userUtterance += event.delta;
      this.lastInputAt = Date.now();
      appendTranscript("user", event.delta);
    }
    if (event.type === "session.input_transcript.done") {
      const utterance = (event.transcript ?? this.userUtterance).trim();
      this.userUtterance = "";
      if (isMayorWake(utterance, this.mayorName)) void invoke("focus_mayor");
      maybeCancel(utterance);
    }
    if (event.type === "session.output_transcript.delta" && event.delta) {
      resetIdle();
      if (Date.now() - this.lastInputAt > 2500) this.userUtterance = "";
      appendTranscript("assistant", event.delta);
      this.townSpeech.delta(event.delta);
    }
    if (event.type === "session.output_transcript.done") this.townSpeech.done(event.transcript);
  }

  clear(): void {
    resetTranscript();
    this.userUtterance = "";
    this.lastInputAt = 0;
    this.townSpeech.clear();
  }
}
