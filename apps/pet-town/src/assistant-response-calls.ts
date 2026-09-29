import { invoke } from "@tauri-apps/api/core";
import { toolTaskContext } from "./assistant-context";
import type { AssistantTasks, LiveEvent } from "./assistant-tasks";

type PendingCall = { callId: string; name: string; args: string };

export class AssistantResponseCalls {
  private responseCalls = new Map<string, PendingCall[]>();
  private handledCalls = new Set<string>();
  private speechFallback: number | null = null;
  constructor(private readonly tasks: AssistantTasks) {}
  clear(): void {
    this.responseCalls.clear();
    this.handledCalls.clear();
    this.noteSpeech();
  }
  noteSpeech(): void {
    if (this.speechFallback !== null) window.clearTimeout(this.speechFallback);
    this.speechFallback = null;
  }
  private sendChannel(payload: unknown): boolean {
    const channel = this.tasks.session.channel();
    if (channel?.readyState !== "open") return false;
    try {
      channel.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }
  handleResponseEvent(envelope: LiveEvent, attempt: number): void {
    const outerId = envelope.delegation_id;
    const inner = envelope.event;
    if (!outerId || !inner) return;
    if (
      inner.type === "response.output_item.done" &&
      inner.item?.type === "function_call" &&
      inner.item.call_id &&
      inner.item.name
    ) {
      const calls = this.responseCalls.get(outerId) ?? [];
      if (
        calls.length < 8 &&
        !this.handledCalls.has(inner.item.call_id) &&
        !calls.some((call) => call.callId === inner.item!.call_id)
      ) {
        calls.push({
          callId: inner.item.call_id!,
          name: inner.item.name!,
          args: inner.item.arguments ?? "{}",
        });
        this.responseCalls.set(outerId, calls);
      }
      return;
    }
    if (inner.type === "response.completed") {
      const calls = this.responseCalls.get(outerId) ?? [];
      this.responseCalls.delete(outerId);
      if (calls.length) {
        for (const call of calls) {
          if (this.handledCalls.size >= 512)
            this.handledCalls.delete(this.handledCalls.values().next().value!);
          this.handledCalls.add(call.callId);
        }
        this.tasks.delegationQueue = this.tasks.delegationQueue.then(() =>
          this.runBackendCalls(outerId, attempt, calls),
        );
      }
    }
  }
  private async runBackendCalls(
    outerId: string,
    attempt: number,
    calls: PendingCall[],
  ): Promise<void> {
    if (attempt !== this.tasks.session.attempt()) return;
    this.tasks.cancellationSent = false;
    const ownsTask = this.tasks.activeDelegationId === null;
    if (ownsTask) this.tasks.activeDelegationId = outerId;
    let fallbackResult = "";
    try {
      for (const call of calls) {
        if (attempt !== this.tasks.session.attempt()) return;
        const output = await this.executeBackendCall(outerId, call);
        if (call.name === "run_pi_task") fallbackResult = output;
        if (
          !this.sendChannel({
            type: "response.item.create",
            event_id: crypto.randomUUID(),
            item: { type: "function_call_output", call_id: call.callId, output },
          })
        ) {
          this.tasks.session.error(
            "The Mayor voice connection closed before Pi's result could be delivered.",
          );
          return;
        }
      }
      if (attempt === this.tasks.session.attempt()) {
        if (!this.sendChannel({ type: "response.create", event_id: crypto.randomUUID() })) {
          this.tasks.session.error(
            "The Mayor voice connection closed before Pi's answer could continue.",
          );
          return;
        }
        if (fallbackResult) this.scheduleSpeechFallback(attempt, fallbackResult);
      }
    } finally {
      if (ownsTask && this.tasks.activeDelegationId === outerId)
        this.tasks.activeDelegationId = null;
      if (attempt === this.tasks.session.attempt()) this.tasks.session.resetIdle();
    }
  }
  private scheduleSpeechFallback(attempt: number, output: string): void {
    this.noteSpeech();
    this.speechFallback = window.setTimeout(() => {
      this.speechFallback = null;
      if (attempt !== this.tasks.session.attempt()) return;
      let result = output;
      try {
        const parsed = JSON.parse(output) as { result?: string; reason?: string };
        result = parsed.result || parsed.reason || output;
      } catch {
        // A plain tool result can still be relayed.
      }
      const content = `Pi has finished. Give the user this verified result now: ${result.slice(0, 1200)}`;
      if (
        !this.sendChannel({
          type: "session.commentary.append",
          event_id: crypto.randomUUID(),
          delegation_id: null,
          content,
        })
      )
        this.tasks.session.error(
          "Pi finished, but the Mayor voice connection closed before it could reply.",
        );
    }, 10_000);
  }
  private async executeBackendCall(outerId: string, call: PendingCall): Promise<string> {
    try {
      if (call.name === "run_pi_task") {
        let task = "";
        try {
          task = String(JSON.parse(call.args || "{}").task ?? "");
        } catch {
          task = "";
        }
        const output = await invoke<string | null>("delegate_orchestrator_task", {
          delegationId: outerId,
          context: toolTaskContext(task),
          full: true,
        });
        return JSON.stringify(
          output
            ? { status: "completed", result: output }
            : {
                status: "not_completed",
                reason:
                  "The Pi task did not finish (it may have been canceled). Tell the user plainly and ask whether to retry instead of assuming progress.",
              },
        );
      }
      if (call.name === "cancel_pi_task") {
        await invoke("cancel_orchestrator_task", { delegationId: outerId });
        return JSON.stringify({ status: "canceled" });
      }
      return JSON.stringify({ status: "error", message: `Unknown tool: ${call.name}` });
    } catch (reason) {
      this.tasks.session.error(reason);
      return JSON.stringify({
        status: "error",
        message: String(reason),
        recovery:
          "Tell the user plainly what failed and suggest the next step instead of assuming the work is still running.",
      });
    }
  }
}
