import { PETS } from "./pets";
import type { V2Preferences } from "./preferences";

export type SectionId = "pets" | "gameplay" | "studio" | "assistant" | "app" | "agents" | "about";
export const SETTINGS_SECTIONS: readonly { id: SectionId; icon: string; label: string }[] = [
  { id: "pets", icon: "🐾", label: "Pets" },
  { id: "gameplay", icon: "🎮", label: "Gameplay" },
  { id: "studio", icon: "✦", label: "Pet Studio" },
  { id: "assistant", icon: "◉", label: "Assistant" },
  { id: "app", icon: "☷", label: "App & Data" },
  { id: "agents", icon: "⌘", label: "Agents" },
  { id: "about", icon: "ⓘ", label: "About" },
];

type SwitchControl = (key: keyof V2Preferences, label: string, description: string) => string;

export function gameplayPage(draft: V2Preferences, toggle: SwitchControl): string {
  return `<header><h1>Gameplay</h1><p>Choose how active your village feels.</p></header><section class="stage" aria-label="Gameplay preview"><span class="stage-chip">Live preview · ${draft.activityLevel}</span><span class="preview-pet plum">🐉<small>working</small></span><span class="stage-note">Status always has priority over play</span></section><div class="two-cards"><section class="card"><div class="card-title"><span class="card-icon">✦</span><div><h2>Autonomy</h2><p>Let available pets start safe interactions.</p></div></div>${toggle("autonomyEnabled", "Allow autonomous play", "Respects live state, cooldowns, and reduced motion")}<label class="field"><span>Activity level</span><select data-pref="activityLevel"><option value="calm">Calm</option><option value="balanced">Balanced</option><option value="playful">Playful</option></select></label></section><section class="card"><div class="card-title"><span class="card-icon">▣</span><div><h2>Playroom</h2><p>A larger space for throws and group actions.</p></div></div>${toggle("playroomEnabled", "Enable Playroom", "Keeps the transparent desktop overlay available")}<button id="open-playroom" class="button secondary wide" type="button" ${draft.playroomEnabled ? "" : "disabled"}>Open Playroom</button></section></div><aside class="callout"><b>Agent state comes first</b><span>Working and blocked interrupt immediately. Other changes wait for a safe action beat, up to two seconds.</span></aside>`;
}

export function petsPage(draft: V2Preferences, toggle: SwitchControl): string {
  return `<header><h1>Pets</h1><p>Choose which reviewed pets can represent live agents.</p></header><div class="pet-grid">${Object.values(
    PETS,
  )
    .map(
      (pet) =>
        `<article class="pet-card"><span>🐉</span><div><h2>${pet.name}</h2><p>${pet.capabilities.length} trusted capabilities</p></div><b class="ready">Installed</b></article>`,
    )
    .join(
      "",
    )}</div><section class="group"><label class="row"><span><b>Pet size</b><small>Applies to the overlay and playroom</small></span><span class="range"><input data-pref="petScale" type="range" min="75" max="175" value="${draft.petScale}"><output>${draft.petScale}%</output></span></label>${toggle("showLabels", "Show name labels", "Display agent name and live state")}</section>`;
}

export function assistantPage(toggle: SwitchControl): string {
  return `<header><h1>Assistant</h1><p>Control how typed action requests are resolved.</p></header><section class="group">${toggle("naturalLanguageEnabled", "Natural-language actions", "Use the on-demand palette in the overlay and playroom")}<label class="row"><span><b>Resolver</b><small>Requests always compile to allowlisted typed actions</small></span><select data-pref="resolver"><option value="local">Local rules</option></select></label></section><aside class="callout"><b>No generated code</b><span>The resolver validates the actor, target, item, live state, cooldown, and reservation before showing Run action.</span></aside><section class="privacy"><h2>Privacy</h2><p>Local rules do not send action text over the network.</p></section>`;
}

export function appDataPage(toggle: SwitchControl): string {
  return `<header><h1>App & Data</h1><p>Appearance, motion, and separate v2 storage.</p></header><section class="group"><label class="row"><span><b>Appearance</b><small>Follow macOS or choose a theme</small></span><select data-pref="appearance"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>${toggle("reducedMotion", "Reduced Motion", "Freezes previews and removes unnecessary travel")}</section><section class="group"><div class="row"><span><b>Storage</b><small>Preferences and v2 pets are kept separate from the current app</small></span><code>~/.pet-village-v2</code></div></section><button id="reset-all" class="button danger" type="button">Reset v2 data…</button>`;
}

export function agentsPage(): string {
  return `<header><h1>Agents</h1><p>Connect sanitized live state to pets.</p></header><section class="group"><div class="row"><span><b>Pet Village v1 bridge</b><small>Optional: set PET_VILLAGE_V1_BIN to reuse its sanitized snapshot contract</small></span><em class="ready">Available</em></div><div class="row"><span><b>Local snapshot file</b><small>Reads ~/.pet-village-v2/agents.json when no bridge is set</small></span><em class="ready">Enabled</em></div></section><aside class="callout"><b>Only display-safe state enters the game</b><span>Prompts, source code, and command output are not accepted by the v2 agent contract.</span></aside>`;
}

export function aboutPage(): string {
  return `<header><h1>About Pet Village v2</h1><p>An Excalibur-native desktop village for live coding agents.</p></header><section class="about-card"><span class="about-mark">🐾</span><h2>Greenfield preview</h2><p>Version 0.1.0 · separate identity and storage</p><p>Built side by side with the current Pet Village. No v1 data is imported or modified.</p></section>`;
}
