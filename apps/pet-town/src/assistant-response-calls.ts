import { invoke } from "@tauri-apps/api/core";
import { toolTaskContext } from "./assistant-context";
import type { AssistantTasks, LiveEvent } from "./assistant-tasks";

type PendingCall = { callId: string; name: string; args: string };

export class AssistantResponseCalls {
  private responseCalls = new Map<string, PendingCall[]>();
  constructor(private readonly tasks: AssistantTasks) {}
  clear(): void {
    this.responseCalls.clear();
  }
  private sendChannel(payload: unknown): boolean {
    if (this.tasks.session.channel()?.readyState === "open") {
      this.tasks.session.channel()?.send(JSON.stringify(payload));
      return true;
    }
    return false;
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
      if (calls.length < 8 && !calls.some((call) => call.callId === inner.item!.call_id)) {
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
      if (calls.length)
        this.tasks.delegationQueue = this.tasks.delegationQueue.then(() =>
          this.runBackendCalls(outerId, attempt, calls),
        );
    }
  }
  private async runBackendCalls(
    outerId: string,
    attempt: number,
    calls: PendingCall[],
  ): Promise<void> {
    if (attempt !== this.tasks.session.attempt() || this.tasks.delegations.has(outerId)) return;
    if (this.tasks.delegations.size >= 512)
      this.tasks.delegations.delete(this.tasks.delegations.values().next().value!);
    this.tasks.delegations.add(outerId);
    this.tasks.cancellationSent = false;
    const ownsTask = this.tasks.activeDelegationId === null;
    if (ownsTask) this.tasks.activeDelegationId = outerId;
    try {
      for (const call of calls) {
        if (attempt !== this.tasks.session.attempt()) return;
        const output = await this.executeBackendCall(outerId, call);
        this.sendChannel({
          type: "response.item.create",
          event_id: crypto.randomUUID(),
          item: { type: "function_call_output", call_id: call.callId, output },
        });
      }
      if (attempt === this.tasks.session.attempt())
        this.sendChannel({ type: "response.create", event_id: crypto.randomUUID() });
    } finally {
      if (ownsTask && this.tasks.activeDelegationId === outerId)
        this.tasks.activeDelegationId = null;
      if (attempt === this.tasks.session.attempt()) this.tasks.session.resetIdle();
    }
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
