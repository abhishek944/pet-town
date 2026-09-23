import { invoke } from "@tauri-apps/api/core";
import { delegationContext } from "./assistant-context";
import { AssistantResponseCalls } from "./assistant-response-calls";
import { readTranscript } from "./assistant-transcript";
import type { OrchestratorStatus } from "./orchestrator-status";

export type LiveEvent = {
  type?: string;
  delta?: string;
  transcript?: string;
  delegation?: { id?: string; target?: string };
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
  status(): OrchestratorStatus | null;
  error(value: unknown): void;
  resetIdle(): void;
};

export class AssistantTasks {
  delegationQueue = Promise.resolve();
  delegations = new Set<string>();
  cancellationSent = false;
  activeDelegationId: string | null = null;
  readonly response = new AssistantResponseCalls(this);
  constructor(readonly session: Session) {}
  clear(): void {
    this.delegations.clear();
    this.response.clear();
    this.cancellationSent = false;
    this.activeDelegationId = null;
  }
  handleDelegation(event: LiveEvent, task: string): void {
    if (event.delegation && event.delegation.target !== "client") return;
    const attempt = this.session.attempt();
    const cancelTarget = this.activeDelegationId ?? this.session.status()?.activeTaskId ?? null;
    if (task.trim() && this.isCancelRequest(task) && cancelTarget && !this.cancellationSent) {
      this.cancellationSent = true;
      const cancelId = event.delegation?.id ?? "";
      this.delegationQueue = this.delegationQueue.then(() =>
        this.cancelDelegation(event, attempt, cancelId, cancelTarget),
      );
    } else {
      const context = delegationContext(task, readTranscript());
      this.delegationQueue = this.delegationQueue.then(() =>
        this.delegate(event, attempt, context),
      );
    }
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
  private async delegate(event: LiveEvent, attempt: number, context: string): Promise<void> {
    const id = event.delegation?.id;
    if (
      attempt !== this.session.attempt() ||
      !id ||
      event.delegation?.target !== "client" ||
      this.delegations.has(id)
    )
      return;
    if (this.delegations.size >= 512)
      this.delegations.delete(this.delegations.values().next().value!);
    this.delegations.add(id);
    this.cancellationSent = false;
    const ownsTask = this.activeDelegationId === null;
    if (ownsTask) this.activeDelegationId = id;
    try {
      const output = await invoke<string | null>("delegate_orchestrator_task", {
        delegationId: id,
        context,
        full: false,
      });
      if (
        attempt === this.session.attempt() &&
        output &&
        this.session.channel()?.readyState === "open"
      )
        this.session.channel()?.send(
          JSON.stringify({
            type: "session.commentary.append",
            event_id: crypto.randomUUID(),
            delegation_id: id,
            content: output,
          }),
        );
    } catch (reason) {
      if (attempt !== this.session.attempt()) return;
      this.session.error(reason);
      if (this.session.channel()?.readyState === "open")
        this.session.channel()?.send(
          JSON.stringify({
            type: "session.commentary.append",
            event_id: crypto.randomUUID(),
            delegation_id: id,
            content:
              "The Pi agent could not complete that request. Please try again or choose another workspace.",
          }),
        );
    } finally {
      if (ownsTask && this.activeDelegationId === id) this.activeDelegationId = null;
      if (attempt === this.session.attempt()) this.session.resetIdle();
    }
  }
  handleResponseEvent(envelope: LiveEvent, attempt: number): void {
    this.response.handleResponseEvent(envelope, attempt);
  }
  private async cancelDelegation(
    event: LiveEvent,
    attempt: number,
    newId: string,
    targetId: string,
  ): Promise<void> {
    if (
      attempt !== this.session.attempt() ||
      !newId ||
      event.delegation?.target !== "client" ||
      this.delegations.has(newId)
    ) {
      this.cancellationSent = false;
      return;
    }
    if (this.delegations.size >= 512)
      this.delegations.delete(this.delegations.values().next().value!);
    this.delegations.add(newId);
    try {
      await invoke("cancel_orchestrator_task", { delegationId: targetId });
    } catch (reason) {
      this.session.error(reason);
    }
    this.cancellationSent = false;
    if (attempt === this.session.attempt() && this.session.channel()?.readyState === "open")
      this.session.channel()?.send(
        JSON.stringify({
          type: "session.commentary.append",
          event_id: crypto.randomUUID(),
          delegation_id: newId,
          content: "The active Pi task was canceled.",
        }),
      );
  }
  private isCancelRequest(value: string): boolean {
    const text = value.trim().toLowerCase();
    return (
      /^(please\s+)?(cancel|stop)(\s+(that|it|the\s+(current\s+)?task))?[.!?]*$/.test(text) ||
      /^(never\s*mind)[.!?]*$/.test(text)
    );
  }
  maybeCancel(value: string): void {
    const request = this.isCancelRequest(value);
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
