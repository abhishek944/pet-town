import { invoke } from "@tauri-apps/api/core";

const SUPPRESS_MS = 700;
const recent = new Map<string, number>();
const inFlight = new Set<string>();

export function focusAgent(id: string): void {
  if (!("__TAURI_INTERNALS__" in window)) return;
  const now = performance.now();
  if (inFlight.has(id) || now - (recent.get(id) ?? 0) < SUPPRESS_MS) return;
  recent.set(id, now);
  inFlight.add(id);
  void invoke("focus_agent", { id })
    .catch((error) => console.warn("Agent focus failed", error))
    .finally(() => inFlight.delete(id));
}
