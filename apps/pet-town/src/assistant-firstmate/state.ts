export type FirstmateReply = { text: string; offset: number; sessionToken: string };

export class FirstmateVoiceState {
  busy = false;
  pendingReply: FirstmateReply | null = null;
  awaitingReply = false;
  awaitingSince = 0;
  ready = false;
  playing = false;
  disposed = false;
}

export interface FirstmateVoiceView {
  error(reason: unknown): void;
  setState(text: string): void;
  render(): void;
}
