import { allCharacterIds, behaviorPackForCharacter, characterDisplayName } from "./character-packs";
import { loadImageSource } from "./image-source";
import { friendlyPetName } from "./preferences-types";
import { previewAnimations } from "./settings-preview";

export type StudioMode = "new" | "extend";
export const EXTENSION_STATES = ["idle", "working", "blocked", "done", "unknown"] as const;
const NEW_SLOTS = ["walk", "work", "blocked", "celebrate", "sleep", "unknown"] as const;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export interface StudioChoice {
  mode: StudioMode;
  name: string;
  baseId: string;
  referenceId: string;
}
export interface StudioIssue {
  message: string;
  fields: string[];
}

export async function existingPetReference(id: string): Promise<string> {
  const animations = previewAnimations(behaviorPackForCharacter(id));
  const option = animations.find((item) => item.locomotion) ?? animations[0];
  if (!option) throw new Error("This pet has no usable reference animation.");
  const source = await loadImageSource(option.assetUrl);
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the character reference.");
  const scale = Math.min(900 / source.naturalWidth, 900 / source.naturalHeight);
  const width = source.naturalWidth * scale;
  const height = source.naturalHeight * scale;
  context.drawImage(source, (1024 - width) / 2, 974 - height, width, height);
  return canvas.toDataURL("image/png");
}

export class StudioWorkflow {
  constructor(onChange: () => void) {
    $("studio-mode").addEventListener("change", onChange);
    $("studio-reference-kind").addEventListener("change", onChange);
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
    return "Create a new pet, then assign different Walking and Listening animations.";
  }
  sync(draftId: string): void {
    const mode = this.mode();
    const referenceKind = $<HTMLSelectElement>("studio-reference-kind").value;
    $("studio-new-fields").hidden = mode !== "new";
    $("studio-existing-field").hidden = mode !== "extend";
    $("studio-source-field").hidden = mode !== "new" || referenceKind !== "existing";
    $("studio-character-prompt-field").hidden = mode === "extend" || referenceKind === "existing";
    $<HTMLElement>("panel-studio").dataset.mode = mode;
    if (!draftId) this.renderMappings([]);
  }
  refreshSources(): void {
    const options = allCharacterIds().map(
      (id) => new Option(characterDisplayName(id) ?? friendlyPetName(id), id),
    );
    for (const id of ["studio-source", "studio-existing"] as const) {
      const select = $<HTMLSelectElement>(id);
      const selected = select.value;
      select.replaceChildren(
        new Option("Choose a pet…", ""),
        ...options.map((option) => option.cloneNode(true) as HTMLOptionElement),
      );
      select.value = [...select.options].some((option) => option.value === selected)
        ? selected
        : "";
    }
  }
  choice(): StudioChoice | StudioIssue {
    const mode = this.mode();
    const baseId = $<HTMLSelectElement>("studio-existing").value;
    const kind = $<HTMLSelectElement>("studio-reference-kind").value;
    const source = $<HTMLSelectElement>("studio-source").value;
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
    if (mode === "new" && !kind)
      return {
        message: "Choose how to create the character reference.",
        fields: ["studio-reference-kind"],
      };
    if (mode === "new" && kind === "existing" && !source)
      return { message: "Choose a reference pet.", fields: ["studio-source"] };
    return {
      mode,
      name,
      baseId,
      referenceId: mode === "extend" ? baseId : kind === "existing" ? source : "",
    };
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
      ? "Optionally replace a state with a new APNG. Unchanged states keep their existing behavior."
      : "Create and approve animations, then assign them to every required behavior.";
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
    for (const id of [
      "studio-mode",
      "studio-reference-kind",
      "studio-source",
      "studio-existing",
    ] as const) {
      $<HTMLSelectElement>(id).disabled = busy || Boolean(draftId);
    }
  }
}
