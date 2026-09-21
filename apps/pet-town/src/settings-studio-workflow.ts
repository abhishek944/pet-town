import { allCharacterIds, behaviorPackForCharacter, characterDisplayName } from "./character-packs";
import { friendlyPetName } from "./preferences-types";

export type StudioMode = "new" | "extend";
export const EXTENSION_STATES = ["idle", "working", "blocked", "done", "unknown"] as const;
const NEW_SLOTS = ["walk", "work", "blocked", "celebrate", "sleep", "unknown"] as const;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export interface StudioChoice {
  mode: StudioMode;
  name: string;
  baseId: string;
}
export interface StudioIssue {
  message: string;
  fields: string[];
}

export class StudioWorkflow {
  constructor(onChange: () => void) {
    $("studio-mode").addEventListener("change", onChange);
  }
  mode(): StudioMode | "" {
    return $<HTMLSelectElement>("studio-mode").value as StudioMode | "";
  }
  startAssistantPet(draftId: string, busy: boolean, reset: () => void): string {
    if (busy) return "Wait for the current Studio action to finish.";
    if (draftId) return "Finish or discard the current draft before creating an assistant pet.";
    if (location.hash === "#studio-orchestrator") location.hash = "studio";
    const mode = $<HTMLSelectElement>("studio-mode");
    mode.value = "new";
    mode.dispatchEvent(new Event("change", { bubbles: true }));
    reset();
    return "Create a new pet, import APNGs, then assign different Walking and Listening animations.";
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
      return {
        message: "Choose whether to create a new pet or extend an existing pet.",
        fields: ["studio-mode"],
      };
    if (mode === "extend" && !baseId)
      return { message: "Choose the pet you want to extend.", fields: ["studio-existing"] };
    if (mode === "new" && !name)
      return { message: "Enter a name for the new pet.", fields: ["studio-name"] };
    return { mode, name, baseId };
  }
  renderMappings(animations: string[]): void {
    const root = $("studio-mappings");
    const extending = this.mode() === "extend";
    const names = extending ? EXTENSION_STATES : NEW_SLOTS;
    root.replaceChildren(
      ...names.map((slot) => {
        const label = document.createElement("label");
        label.textContent = friendlyPetName(slot);
        const select = document.createElement("select");
        select.id = extending ? `studio-extend-${slot}` : `studio-map-${slot}`;
        label.append(select);
        return label;
      }),
    );
    $("studio-mapping-hint").textContent = extending
      ? "Optionally replace a state with an imported APNG. Unchanged states keep their existing behavior."
      : "Assign imported APNGs to every required behavior.";
    $("studio-save").textContent = extending ? "Validate & save extension" : "Validate & save pet";
    this.refreshMappings(animations);
  }
  refreshMappings(animations: string[]): void {
    const extending = this.mode() === "extend";
    for (const name of extending ? EXTENSION_STATES : NEW_SLOTS) {
      const select = $<HTMLSelectElement>(
        extending ? `studio-extend-${name}` : `studio-map-${name}`,
      );
      const value = select.value;
      const empty = extending ? "Keep existing behavior" : "Choose…";
      select.replaceChildren(
        new Option(empty, ""),
        ...animations.map((id) => new Option(friendlyPetName(id), id)),
      );
      select.value = animations.includes(value)
        ? value
        : !extending && animations.includes(name)
          ? name
          : "";
    }
  }
  stateAssignments(): Record<string, string> {
    return Object.fromEntries(
      EXTENSION_STATES.map((state) => [
        state,
        $<HTMLSelectElement>(`studio-extend-${state}`).value,
      ]).filter(([, animation]) => animation),
    );
  }
  existingActionIds(): string[] {
    const id = $<HTMLSelectElement>("studio-existing").value;
    return id ? Object.keys(behaviorPackForCharacter(id).actions) : [];
  }
  lock(busy: boolean, draftId: string): void {
    for (const id of ["studio-mode", "studio-existing"] as const) {
      $<HTMLSelectElement>(id).disabled = busy || Boolean(draftId);
    }
  }
}
