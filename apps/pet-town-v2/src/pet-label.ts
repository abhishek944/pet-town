import type { AgentView } from "@pet-town/core";

export function petLabelText(agent: AgentView, maxChars: number): string {
  if (agent.name.length <= maxChars) return agent.name;
  const left = Math.ceil((maxChars - 1) / 2);
  const right = Math.floor((maxChars - 1) / 2);
  return `${agent.name.slice(0, left)}…${agent.name.slice(-right)}`;
}

export function petLabelWidth(text: string): number {
  return Math.min(104, Math.max(42, Math.ceil(text.length * 5.8 + 12)));
}
