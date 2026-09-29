import { invoke } from "@tauri-apps/api/core";
import { AssistantResponseCalls } from "./assistant-response-calls";

export type LiveEvent = {
  type?: string;
  delta?: string;
  transcript?: string;
  delegation_id?: string;
  event?: {
    type?: string;
    item?: { type?: string; call_id?: string; name?: string; arguments?: string };
  };
  error?: { message?: string };
};
export type Session = {
  attempt(): number;
  channel(): RTCDataChannel | null;
  error(value: unknown): void;
  resetIdle(): void;
};

export class AssistantTasks {
  delegationQueue = Promise.resolve();
  cancellationSent = false;
  activeDelegationId: string | null = null;
  readonly response = new AssistantResponseCalls(this);
  constructor(readonly session: Session) {}

  clear(): void {
    this.response.clear();
    this.cancellationSent = false;
    this.activeDelegationId = null;
  }

  handleResponseEvent(envelope: LiveEvent, attempt: number): void {
    this.response.handleResponseEvent(envelope, attempt);
  }

  noteSpeech(): void {
    this.response.noteSpeech();
  }

  cancelActive(): void {
    const delegationId = this.activeDelegationId;
    if (!delegationId || this.cancellationSent) return;
    this.cancellationSent = true;
    void invoke("cancel_orchestrator_task", { delegationId }).catch((reason) => {
      this.cancellationSent = false;
      this.session.error(reason);
    });
  }

  maybeCancel(value: string): void {
    const request =
      /^(please\s+)?(cancel|stop)(\s+(that|it|the\s+(current\s+)?task))?[.!?]*$|^(never\s*mind)[.!?]*$/i.test(
        value.trim(),
      );
    const delegationId = this.activeDelegationId;
    if (this.cancellationSent || !request || !delegationId) return;
    this.cancellationSent = true;
    void invoke("cancel_orchestrator_task", { delegationId })
      .then(() => {
        if (this.session.channel()?.readyState === "open")
          this.session.channel()?.send(
            JSON.stringify({
              type: "session.commentary.append",
              event_id: crypto.randomUUID(),
              delegation_id: delegationId,
              content: "The active Pi task was canceled.",
            }),
          );
      })
      .catch((reason) => {
        this.cancellationSent = false;
        this.session.error(reason);
      });
  }
}
