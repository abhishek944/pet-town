import { invoke } from "@tauri-apps/api/core";

export class TownSpeech {
  private text = "";
  private speaking = false;
  private nextReply = true;
  private publishTimer = 0;
  private quietTimer = 0;
  private queue = Promise.resolve();

  delta(value: string): void {
    if (this.nextReply) this.text = "";
    this.nextReply = false;
    this.text = (this.text + value).slice(-2400);
    this.speaking = true;
    this.schedule();
    clearTimeout(this.quietTimer);
    this.quietTimer = window.setTimeout(() => {
      this.speaking = false;
      this.nextReply = true;
      this.publish();
    }, 2000);
  }

  done(transcript?: string): void {
    clearTimeout(this.quietTimer);
    if (transcript?.trim()) this.text = transcript.trim().slice(-2400);
    this.speaking = false;
    this.nextReply = true;
    this.publish();
  }

  clear(): void {
    clearTimeout(this.publishTimer);
    clearTimeout(this.quietTimer);
    this.text = "";
    this.speaking = false;
    this.nextReply = true;
    this.publish();
  }

  private schedule(): void {
    if (this.publishTimer) return;
    this.publishTimer = window.setTimeout(() => this.publish(), 90);
  }

  private publish(): void {
    clearTimeout(this.publishTimer);
    this.publishTimer = 0;
    const text = this.text;
    const speaking = this.speaking;
    this.queue = this.queue
      .then(() => invoke<void>("set_mayor_speech", { text, speaking }))
      .catch(() => {});
  }
}
