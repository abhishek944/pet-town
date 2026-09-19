import type { CapabilityId, CapabilitySpec } from "./types";

export const CAPABILITIES: Readonly<Record<CapabilityId, CapabilitySpec>> = {
  walk: { id: "walk", label: "Walk", requiresTarget: false, requiresItem: false, cooldownMs: 0 },
  throw: {
    id: "throw",
    label: "Throw",
    requiresTarget: true,
    requiresItem: true,
    cooldownMs: 8_000,
  },
  catch: {
    id: "catch",
    label: "Catch",
    requiresTarget: true,
    requiresItem: true,
    cooldownMs: 8_000,
  },
  wave: {
    id: "wave",
    label: "Wave",
    requiresTarget: false,
    requiresItem: false,
    cooldownMs: 3_000,
  },
  sleep: {
    id: "sleep",
    label: "Sleep",
    requiresTarget: false,
    requiresItem: false,
    cooldownMs: 10_000,
  },
  react: {
    id: "react",
    label: "React",
    requiresTarget: true,
    requiresItem: false,
    cooldownMs: 3_000,
  },
  follow: {
    id: "follow",
    label: "Follow",
    requiresTarget: true,
    requiresItem: false,
    cooldownMs: 5_000,
  },
  dance: {
    id: "dance",
    label: "Dance",
    requiresTarget: false,
    requiresItem: false,
    cooldownMs: 8_000,
  },
};

export function isCapabilityId(value: string): value is CapabilityId {
  return Object.prototype.hasOwnProperty.call(CAPABILITIES, value);
}
