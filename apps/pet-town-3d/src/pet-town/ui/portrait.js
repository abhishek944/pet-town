import { agentSeed } from "../agents/random.js";
import { agentAppearance } from "../agents/appearance-identity.js";
import { createPetPortrait } from "../pets/preview.js";
import { getPetDefinition } from "../pets/catalog.js";

export function createPortrait(record) {
  if (getPetDefinition(record.petId)) return createPetPortrait(record.petId);
  const { coat, accent, variant } = agentAppearance(agentSeed(record.id), record.isMayor);
  const span = document.createElement("span");
  span.className = "town-portrait";
  span.setAttribute("aria-hidden", "true");
  span.style.background = `${coat}40`;
  const accessories = [
    `<g fill="none" stroke="#e9d8ae" stroke-width="1.7"><circle cx="21" cy="30" r="5.3"/><circle cx="35" cy="30" r="5.3"/><path d="M26 30h4"/></g>`,
    `<path d="M35 14Q30-2 43 1Q49 11 35 14Z" fill="${accent}"/><path d="m34 17 7-13" stroke="#645738"/>`,
    `<path d="M28 11Q13-1 16 14Q20 19 28 11Q42-1 40 14Q35 18 28 11" fill="${accent}"/><circle cx="28" cy="11" r="3" fill="#e9d8ae"/>`,
    `<g fill="${accent}"><circle cx="15" cy="17" r="4"/><circle cx="9" cy="17" r="4"/><circle cx="12" cy="11" r="4"/><circle cx="12" cy="22" r="4"/><circle cx="12" cy="17" r="3" fill="#e9d8ae"/></g>`,
    `<path d="m20 12 8-11 9 12Z" fill="${accent}"/><circle cx="28" cy="2" r="2" fill="#e9d8ae"/>`,
  ];
  const crown = `<path d="m13 12-1-10 9 5 7-7 7 7 9-5-1 10Z" fill="#ffd36a" stroke="#a37b34" stroke-width="1.4"/>`;
  span.innerHTML = `<svg viewBox="0 0 56 56" aria-hidden="true">
    <path d="M10 56q1-15 18-15t18 15" fill="${coat}"/>
    <ellipse cx="28" cy="29" rx="22" ry="23" fill="${coat}"/>
    <ellipse cx="28" cy="31" rx="17" ry="16" fill="#f3dcbd"/>
    <path d="M15 43q12 7 26 0l-2 8H18Z" fill="${accent}"/>
    <ellipse cx="21" cy="30" rx="1.9" ry="2.3" fill="#594a36"/>
    <ellipse cx="35" cy="30" rx="1.9" ry="2.3" fill="#594a36"/>
    <path d="M25 36q3 3 6 0" fill="none" stroke="#79644e" stroke-width="1.5"/>
    ${record.isMayor ? crown : accessories[variant]}</svg>`;
  return span;
}

export function companionStatus(record) {
  return (
    {
      blocked: "Needs you",
      done: "Done",
      completed: "Done",
      idle: "Ready",
      working: "Working",
      speaking: "Speaking",
      listening: "Listening",
    }[record.status] ?? "Ready"
  );
}

export function companionNames(records) {
  const counts = new Map();
  const result = new Map();
  const sorted = [...records.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const r of sorted) counts.set(r.label, (counts.get(r.label) ?? 0) + 1);
  const seen = new Map();
  for (const r of sorted) {
    const ordinal = (seen.get(r.label) ?? 0) + 1;
    seen.set(r.label, ordinal);
    result.set(r.id, counts.get(r.label) > 1 ? `${r.label} · ${ordinal}` : r.label);
  }
  return result;
}
