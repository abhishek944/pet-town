import { allCharacterIds, behaviorPackForCharacter, characterDisplayName } from "./character-packs";
import { friendlyPetName } from "./preferences-types";
import { PET_STATES, type HerdrState, type PetAction } from "./flow-types";

export type StudioMode = "new" | "extend";
export interface StudioChoice {
  mode: StudioMode;
  name: string;
  baseId: string;
}
export interface StudioIssue {
  message: string;
  fields: string[];
}
export interface StateSelection {
  animation: string | null;
  action: PetAction;
  visible: boolean;
}
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const label = (state: HerdrState): string =>
  ({
    idle: "Idle",
    working: "Running",
    blocked: "Blocked",
    done: "Completed",
    unknown: "Unknown",
    listening: "Listening (mayor)",
  })[state];

export class StudioWorkflow {
  constructor(onChange: () => void) {
    $("studio-mode").addEventListener("change", onChange);
  }
  mode(): StudioMode | "" {
    return $<HTMLSelectElement>("studio-mode").value as StudioMode | "";
  }
  startAssistantPet(draftId: string, busy: boolean, reset: () => void): string {
    if (busy) return "Wait for the current Studio action to finish.";
    if (draftId) return "Finish or discard the current draft before creating a mayor pet.";
    if (location.hash === "#studio-orchestrator") location.hash = "studio";
    const mode = $<HTMLSelectElement>("studio-mode");
    mode.value = "new";
    mode.dispatchEvent(new Event("change", { bubbles: true }));
    reset();
    return "Create a new pet, import an APNG, and assign an APNG and action to each state.";
  }
  sync(draftId: string): void {
    const mode = this.mode();
    $("studio-new-fields").hidden = mode !== "new";
    $("studio-existing-field").hidden = mode !== "extend";
    $<HTMLElement>("panel-studio").dataset.mode = mode;
    if (!draftId) this.renderMappings([]);
  }
  refreshSources(): void {
    const options = allCharacterIds().map(
      (id) => new Option(characterDisplayName(id) ?? friendlyPetName(id), id),
    );
    const select = $<HTMLSelectElement>("studio-existing");
    const selected = select.value;
    select.replaceChildren(new Option("Choose a pet…", ""), ...options);
    select.value = [...select.options].some((option) => option.value === selected) ? selected : "";
  }
  choice(): StudioChoice | StudioIssue {
    const mode = this.mode();
    const baseId = $<HTMLSelectElement>("studio-existing").value;
    const name =
      mode === "extend"
        ? (characterDisplayName(baseId) ?? friendlyPetName(baseId))
        : $<HTMLInputElement>("studio-name").value.trim();
    if (!mode)
      return { message: "Choose whether to create or extend a pet.", fields: ["studio-mode"] };
    if (mode === "extend" && !baseId)
      return { message: "Choose a pet to extend.", fields: ["studio-existing"] };
    if (mode === "new" && !name)
      return { message: "Enter a name for the new pet.", fields: ["studio-name"] };
    return { mode, name, baseId };
  }
  renderMappings(animations: string[]): void {
    const root = $("studio-mappings");
    root.replaceChildren(
      ...PET_STATES.map((state) => {
        const row = document.createElement("div");
        row.className = "studio-state-row";
        const title = document.createElement("strong");
        title.textContent = label(state);
        const clipLabel = document.createElement("label");
        clipLabel.textContent = "APNG";
        const clip = document.createElement("select");
        clip.id = `studio-state-${state}-animation`;
        clip.addEventListener("change", () => {
          clip.dataset.touched = "true";
        });
        clipLabel.append(clip);
        const actionLabel = document.createElement("label");
        actionLabel.textContent = "Action";
        const action = document.createElement("select");
        action.id = `studio-state-${state}-action`;
        action.replaceChildren(new Option("Idle", "idle"), new Option("Walking", "walking"));
        actionLabel.append(action);
        row.append(title, clipLabel, actionLabel);
        return row;
      }),
    );
    $("studio-mapping-hint").textContent =
      "Choose an APNG and an action for each visible state. Hidden states need no APNG. The same APNG can serve several states.";
    $("studio-save").textContent =
      this.mode() === "extend" ? "Validate & save extension" : "Validate & save pet";
    this.refreshMappings(animations);
  }
  refreshMappings(animations: string[]): void {
    const extending = this.mode() === "extend";
    const id = $<HTMLSelectElement>("studio-existing").value;
    const pack = extending && id ? behaviorPackForCharacter(id) : null;
    for (const state of PET_STATES) {
      const select = $<HTMLSelectElement>(`studio-state-${state}-animation`);
      const action = $<HTMLSelectElement>(`studio-state-${state}-action`);
      if (!select || !action) continue;
      const previous = select.value;
      const existing = pack
        ? Object.keys(pack.clips).map(
            (clip) => new Option(`${friendlyPetName(clip)} (existing)`, `existing:${clip}`),
          )
        : [];
      const imported = animations.map(
        (clip) => new Option(friendlyPetName(clip), `imported:${clip}`),
      );
      select.replaceChildren(new Option("Hidden", ""), ...existing, ...imported);
      const defaultAssignment = pack?.stateAssignments[state];
      const initial =
        defaultAssignment?.visible && defaultAssignment.animation
          ? `existing:${defaultAssignment.animation}`
          : ["idle", "unknown"].includes(state)
            ? ""
            : animations.length
              ? `imported:${animations[0]}`
              : "";
      select.value =
        select.dataset.touched && [...select.options].some((option) => option.value === previous)
          ? previous
          : initial;
      if (!action.dataset.initialized) {
        action.value = defaultAssignment?.action ?? (state === "working" ? "walking" : "idle");
        action.dataset.initialized = "true";
      }
    }
  }
  assignImportedAnimation(state: HerdrState, animationId: string): boolean {
    const select = $<HTMLSelectElement>(`studio-state-${state}-animation`);
    const value = `imported:${animationId}`;
    if (![...select.options].some((option) => option.value === value)) return false;
    select.value = value;
    select.dataset.touched = "true";
    return select.value === value;
  }
  stateAssignments(): Record<HerdrState, StateSelection> {
    return Object.fromEntries(
      PET_STATES.map((state) => {
        const value = $<HTMLSelectElement>(`studio-state-${state}-animation`).value;
        const action = $<HTMLSelectElement>(`studio-state-${state}-action`).value as PetAction;
        return [state, { animation: value || null, action, visible: Boolean(value) }];
      }),
    ) as Record<HerdrState, StateSelection>;
  }
  lock(busy: boolean, draftId: string): void {
    for (const id of ["studio-mode", "studio-existing"] as const) {
      $<HTMLSelectElement>(id).disabled = busy || Boolean(draftId);
    }
  }
}
