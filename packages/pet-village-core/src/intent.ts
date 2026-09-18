import { CAPABILITIES, isCapabilityId } from "./capabilities";
import type { AgentView, CapabilityId, IntentResolution, PetDefinition } from "./types";

const aliases: Readonly<Record<string, CapabilityId>> = {
  walks: "walk",
  walking: "walk",
  throws: "throw",
  toss: "throw",
  tosses: "throw",
  catches: "catch",
  waves: "wave",
  waving: "wave",
  sleeps: "sleep",
  sleeping: "sleep",
  reacts: "react",
  follows: "follow",
  dances: "dance",
  dancing: "dance",
};

function words(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function sequenceIndex(tokens: readonly string[], phrase: readonly string[]): number {
  for (let index = 0; index <= tokens.length - phrase.length; index += 1) {
    if (phrase.every((word, offset) => tokens[index + offset] === word)) return index;
  }
  return -1;
}

export function resolveIntent(
  request: string,
  agents: readonly AgentView[],
  pets: Readonly<Record<string, PetDefinition>>,
): IntentResolution {
  const tokens = words(request);
  if (tokens.length === 0) return { status: "invalid", message: "Describe an action first." };

  const matches = agents
    .map((agent) => ({ agent, name: words(agent.name) }))
    .map(({ agent, name }) => ({
      agent,
      index: sequenceIndex(tokens, name),
      nameLength: name.length,
    }))
    .filter((match) => match.index >= 0);
  const nameTokens = new Set<number>();
  for (const match of matches)
    for (let offset = 0; offset < match.nameLength; offset += 1)
      nameTokens.add(match.index + offset);
  const capabilityIndex = tokens.findIndex(
    (token, index) => !nameTokens.has(index) && isCapabilityId(aliases[token] ?? token),
  );
  const capabilityToken =
    capabilityIndex >= 0 ? (aliases[tokens[capabilityIndex]] ?? tokens[capabilityIndex]) : "";
  if (!isCapabilityId(capabilityToken)) {
    return {
      status: "invalid",
      message: "Use an available action such as wave, walk, throw, catch, follow, dance, or sleep.",
    };
  }

  if (matches.length === 0) {
    return {
      status: "ambiguous",
      message: "Which pet should act?",
      choices: agents.map((agent) => agent.name),
    };
  }
  const duplicateIdentity = matches.some((match, index) =>
    matches.some((other, otherIndex) => index !== otherIndex && other.index === match.index),
  );
  if (duplicateIdentity) {
    return {
      status: "ambiguous",
      message: "Two available pets share that name. Choose one from the pet menu.",
      choices: matches.map((match) => match.agent.id),
    };
  }

  const actorCandidates = matches.filter((match) => match.index < capabilityIndex);
  if (actorCandidates.length !== 1) {
    return {
      status: "ambiguous",
      message: "Put one acting pet before the action.",
      choices: matches.map((match) => match.agent.name),
    };
  }
  const actor = actorCandidates[0].agent;
  const capability = capabilityToken;
  if (!pets[actor.petId]?.capabilities.includes(capability)) {
    return {
      status: "invalid",
      message: `${actor.name} does not have the ${CAPABILITIES[capability].label} capability.`,
    };
  }

  const spec = CAPABILITIES[capability];
  const targetMatches = matches.filter(
    (match) => match.agent.id !== actor.id && match.index > capabilityIndex,
  );
  if (targetMatches.length > 1) {
    return {
      status: "ambiguous",
      message: "Choose one target pet.",
      choices: targetMatches.map((match) => match.agent.name),
    };
  }
  const target = targetMatches[0]?.agent;
  if (spec.requiresTarget && !target) {
    return {
      status: "ambiguous",
      message: `Who should ${actor.name} ${capability}?`,
      choices: agents.filter((agent) => agent.id !== actor.id).map((agent) => agent.name),
    };
  }

  const hasBall = tokens.includes("ball");
  if (spec.requiresItem && !hasBall)
    return { status: "ambiguous", message: "Which supported item?", choices: ["Ball"] };
  const intent = {
    actorId: actor.id,
    capability,
    targetId: target?.id,
    item: hasBall ? ("ball" as const) : undefined,
  };
  const summary = [
    actor.name,
    CAPABILITIES[capability].label,
    hasBall ? "Ball" : null,
    target?.name,
  ]
    .filter(Boolean)
    .join(" · ");
  return { status: "ready", intent, summary };
}
