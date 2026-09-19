import { invoke } from "@tauri-apps/api/core";

const SUPPRESS_MS = 700;
const recent = new Map<string, number>();
const inFlight = new Set<string>();
const dropped = new Map<string, number>();

export function suppressFocus(id: string): void {
  dropped.set(id, Date.now());
}

export function pruneSuppressed(active: Iterable<string>): void {
  const keep = new Set(active);
  for (const id of [...dropped.keys()]) if (!keep.has(id)) dropped.delete(id);
}

export function focusAgent(id: string): void {
  if (!("__TAURI_INTERNALS__" in window)) return;
  const droppedAt = dropped.get(id);
  dropped.delete(id);
  if (droppedAt !== undefined && Date.now() - droppedAt < 1500) return;
  const now = performance.now();
  if (inFlight.has(id) || now - (recent.get(id) ?? 0) < SUPPRESS_MS) return;
  recent.set(id, now);
  inFlight.add(id);
  void invoke("focus_agent", { id })
    .catch((error) => console.warn("Agent focus failed", error))
    .finally(() => inFlight.delete(id));
}
