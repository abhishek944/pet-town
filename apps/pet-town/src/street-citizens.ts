import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { CitizenState } from "./village";

export interface StreetMembership {
  fetch(): Promise<void>;
  select(citizens: ReadonlyMap<string, CitizenState>): Map<string, CitizenState>;
  isPrimary(): boolean;
}

/** Which street this window serves. Every window computes the same split:
 * sorted citizen ids dealt round-robin across streets. The orchestrator pet
 * stays on the primary street instead of duplicating on every display.
 * Selection never mutates the complete roster owned by the caller. */
export function createStreetMembership(): StreetMembership {
  let index = 0;
  let total = 1;
  return {
    async fetch(): Promise<void> {
      try {
        const assignment = await invoke<{ index: number; total: number }>("street_assignment");
        index = assignment.index;
        total = Math.max(1, assignment.total);
      } catch {
        index = 0;
        total = 1;
      }
    },
    select(citizens: ReadonlyMap<string, CitizenState>): Map<string, CitizenState> {
      const regular = [...citizens.keys()]
        .filter((id) => citizens.get(id)?.source !== "orchestrator")
        .sort();
      const selected = new Set(regular.filter((_, position) => position % total === index));
      return new Map(
        [...citizens].filter(([id, citizen]) =>
          citizen.source === "orchestrator" ? index === 0 : selected.has(id),
        ),
      );
    },
    isPrimary(): boolean {
      return index === 0;
    },
  };
}

/** Re-partition when displays change, then let the caller render. */
export async function watchStreetChanges(
  membership: StreetMembership,
  onChange: () => void,
): Promise<void> {
  await listen("streets-changed", async () => {
    await membership.fetch();
    onChange();
  });
}
