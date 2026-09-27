import { invoke } from "@tauri-apps/api/core"; import { behaviorPackForCharacter, characterDisplayName } from "./character-packs"; import type { HerdrState } from "./flow-types"; import { friendlyPetName } from "./preferences-types"; import { saveExtension, type ExtensionSaveResult } from "./settings-studio-extension";
import { showStudioImage } from "./settings-studio-media"; import { setStudioBusy, type StudioBusyOperation, waitForStudioPaint } from "./settings-studio-progress"; import { advanceStudioWizard } from "./settings-studio-steps"; import { bindStudioValidationClear, showStudioValidation } from "./settings-studio-validation"; import { StudioWorkflow } from "./settings-studio-workflow"; import { StudioWizard } from "./settings-studio-wizard";
type DraftView = { draftId: string; displayName: string }; type AnimationAssetView = { animationId: string; dataUrl: string }; type DraftDiscardResult = { cleanupWarning: string | null };
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export class PetStudio {
  private draftId = ""; private approved = new Map<string, string>(); private busy = false;
  private workflow: StudioWorkflow; private wizard: StudioWizard;
  constructor() {
    this.workflow = new StudioWorkflow(() => { this.workflow.sync(this.draftId); this.refreshApproved(); this.syncControls(); });
    this.wizard = new StudioWizard(() => void this.advanceWizard()); this.refreshSources();
    $("studio-name").addEventListener("input", () => this.syncControls()); $("studio-existing").addEventListener("change", () => this.syncControls());
    $("studio-cancel").addEventListener("click", () => void this.cancelDraft());
    $("studio-import-animation").addEventListener("change", (event) => void this.importApng(event, this.animationId(), "stationary"));
    $("studio-save").addEventListener("click", () => void this.save());
    window.addEventListener("hashchange", () => this.syncRoute()); window.addEventListener("pet-studio-create-assistant-pet", () => this.status(this.workflow.startAssistantPet(this.draftId, this.busy, () => this.wizard.reset())));
    bindStudioValidationClear(); this.workflow.sync(this.draftId); this.syncRoute(); this.syncControls();
  }
  private syncRoute(): void {
    if (location.hash === "#studio-orchestrator") location.hash = "studio";
  }
  private mode() { return this.workflow.mode(); } refreshSources(): void { this.workflow.refreshSources(); }
  /** Import a Finder-selected APNG and assign it to the state that opened Studio. */
  importApngForState(petId: string, state: HerdrState, file: File): void {
    if (this.busy) {
      this.status("Wait for the current Studio action to finish.");
      return;
    }
    void this.startImportForState(petId, state, file);
  }
  private async startImportForState(petId: string, state: HerdrState, file: File): Promise<void> {
    this.refreshSources();
    const base = $<HTMLSelectElement>("studio-existing");
    if (![...base.options].some((option) => option.value === petId)) {
      this.status("That pet is not available in Pet Studio.");
      return;
    }
    if (this.draftId) await this.cancelDraft();
    if (this.busy || this.draftId) return;
    this.refreshSources();
    const mode = $<HTMLSelectElement>("studio-mode");
    mode.value = "extend";
    mode.dispatchEvent(new Event("change", { bubbles: true }));
    base.value = petId;
    this.workflow.sync("");
    this.wizard.reset();
    this.wizard.go(2);
    this.syncControls();
    if (!(await this.startDraft())) return;
    const animationId = this.animationIdFromFilename(file.name, petId);
    $<HTMLInputElement>("studio-animation-id").value = animationId;
    if (!(await this.importFile(file, animationId, "stationary"))) return;
    if (!this.workflow.assignImportedAnimation(state, animationId)) {
      this.status(`Imported ${friendlyPetName(animationId)}, but could not assign it to ${state}.`);
      return;
    }
    this.wizard.go(3);
    this.syncControls();
    const select = document.getElementById(`studio-state-${state}-animation`);
    select?.scrollIntoView({ block: "nearest" });
    (select as HTMLSelectElement | null)?.focus({ preventScroll: true });
    this.status(`${friendlyPetName(animationId)} imported and assigned to ${state}. Review the mapping, then save the extension.`, true);
  }
  private status(message: string, success = false, fields: string[] = [], pending = false): void {
    showStudioValidation(message, fields); const output = $<HTMLElement>("studio-message"); output.setAttribute("aria-live", pending ? "off" : "polite"); output.textContent = message; output.dataset.success = String(success); output.dataset.pending = String(pending);
  }
  showExtensionWarning(message: string): void { this.status(message); }
  private setBusy(value: boolean, operation: StudioBusyOperation = null): void { this.busy = value; setStudioBusy(value, operation); this.syncControls(); }
  private syncControls(): void {
    const step = this.wizard.current(); const choiceReady = !("message" in this.workflow.choice()); const nextReady = step === 0 ? Boolean(this.mode()) : step === 1 ? choiceReady : step === 2 ? this.mode() === "extend" || this.approved.size > 0 : true;
    $<HTMLButtonElement>("studio-wizard-next").disabled = this.busy || !nextReady; $<HTMLButtonElement>("studio-wizard-previous").disabled = this.busy || step === 0; $("studio-cancel").hidden = !this.draftId;
    $<HTMLButtonElement>("studio-save").disabled = this.busy || !this.draftId;
    $<HTMLElement>("panel-studio").querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea").forEach((control) => { control.disabled = this.busy; }); this.workflow.lock(this.busy, this.draftId);
  }
  private resetDraftState(): void {
    document.body.classList.remove("studio-has-draft"); this.approved.clear(); $<HTMLInputElement>("studio-assign-orchestrator").checked = false;
    const preview = $<HTMLImageElement>("studio-apng-preview"); preview.hidden = true; preview.removeAttribute("src"); $("studio-animation-step").hidden = true; $("studio-map-step").hidden = true; this.refreshApproved();
  }
  private async cancelDraft(): Promise<void> {
    if (!this.draftId || this.busy) return; this.setBusy(true, "discard-draft"); this.status("Discarding the pet draft…", false, [], true); await waitForStudioPaint();
    try { const result = await invoke<DraftDiscardResult>("discard_pet_draft", { request: { draftId: this.draftId } }); this.draftId = ""; this.resetDraftState(); this.workflow.sync(""); this.wizard.reset(); this.status(result.cleanupWarning ?? "Draft discarded. Choose what to make next.", !result.cleanupWarning); }
    catch (error) { this.status(String(error)); } finally { this.setBusy(false); }
  }
  private async advanceWizard(): Promise<void> {
    await advanceStudioWizard({ wizard: this.wizard, mode: this.mode(), draftId: () => this.draftId, startDraft: () => this.startDraft(), approvedCount: () => this.approved.size, status: (message, success, fields) => this.status(message, success, fields), syncControls: () => this.syncControls() });
  }
  private async startDraft(operation: StudioBusyOperation = "prepare-draft"): Promise<boolean> {
    if (this.busy) return false; const choice = this.workflow.choice(); if ("message" in choice) { this.status(choice.message, false, choice.fields); return false; }
    const { mode, name } = choice; if (this.draftId) { this.status("Cancel the current draft before starting another."); return false; }
    this.setBusy(true, operation); this.status("Preparing the pet draft…", false, [], true); await waitForStudioPaint();
    try { const draft = await invoke<DraftView>("create_pet_draft", { request: { displayName: name } }); this.resetDraftState(); this.draftId = draft.draftId; document.body.classList.add("studio-has-draft"); $<HTMLElement>("panel-studio").dataset.mode = mode; this.workflow.renderMappings([]); this.status(mode === "extend" ? `Ready to import animations for ${name}.` : "Draft ready. Import the character’s APNG animations.", true); return true; }
    catch (error) { this.status(String(error)); return false; } finally { this.setBusy(false); }
  }
  private async importApng(event: Event, animationId: string, role: string): Promise<void> {
    const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0];
    if (!file) return;
    if (!this.draftId || this.busy) { this.status("Start a draft before importing APNGs."); input.value = ""; return; }
    if (!/^[a-z][a-z0-9-]*$/.test(animationId)) { this.status("Enter an animation name that starts with a letter.", false, ["studio-animation-id"]); input.value = ""; return; }
    await this.importFile(file, animationId, role);
    input.value = "";
  }
  private async importFile(file: File, animationId: string, role: string): Promise<boolean> {
    if (!this.draftId || this.busy) return false;
    this.setBusy(true, "import-animation"); this.status(`Importing and validating ${file.name}…`, false, [], true); await waitForStudioPaint();
    try {
      const apngDataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read the APNG.")); reader.readAsDataURL(file); });
      const asset = await invoke<AnimationAssetView>("import_pet_animation", { request: { draftId: this.draftId, animationId, apngDataUrl, role } }); await this.show("studio-apng-preview", asset.dataUrl); this.approved.set(animationId, asset.dataUrl); this.refreshApproved();
      this.status(`${friendlyPetName(animationId)} APNG imported and validated.`, true);
      return true;
    } catch (error) { this.status(`${file.name}: ${String(error)}`); return false; } finally { this.setBusy(false); }
  }
  private async save(): Promise<void> {
    if (this.busy || !this.draftId) return; const mode = this.mode();
    if (mode === "extend") {
      const stateAssignments = this.workflow.stateAssignments(); this.setBusy(true, "save-pet"); this.status("Validating and saving the extension…", false, [], true); await waitForStudioPaint();
      try { const baseId = $<HTMLSelectElement>("studio-existing").value; const result = await saveExtension({ draftId: this.draftId, baseId, stateAssignments }); this.draftId = ""; this.resetDraftState(); this.workflow.sync(""); this.wizard.reset(); const name = characterDisplayName(result.id) ?? friendlyPetName(result.id); this.status(result.reloadWarning ?? `Extended ${name}. The village has reloaded it.`, !result.reloadWarning); }
      catch (error) { this.status(String(error)); } finally { this.setBusy(false); } return;
    }
    const stateAssignments = this.workflow.stateAssignments();
    if (!Object.values(stateAssignments).some((assignment) => assignment.visible)) { this.status("Choose an APNG for at least one visible state."); return; }
    const assignToOrchestrator = $<HTMLInputElement>("studio-assign-orchestrator").checked;
    if (assignToOrchestrator && (!stateAssignments.working.visible || !stateAssignments.listening.visible)) {
      this.status("Choose APNGs for Running and Listening to use this pet as Mayor.", false, ["studio-state-working-animation", "studio-state-listening-animation"]); return;
    }
    this.setBusy(true, "save-pet"); this.status("Validating and saving the pet…", false, [], true); await waitForStudioPaint();
    try { const result = await invoke<ExtensionSaveResult>("save_pet_pack", { request: { draftId: this.draftId, displayName: $<HTMLInputElement>("studio-name").value.trim(), stateAssignments, assignToOrchestrator } }); this.draftId = ""; this.resetDraftState(); this.workflow.sync(""); this.wizard.reset(); this.status(result.reloadWarning ?? `Saved ${result.id}. It is now available in the village. Start a new draft to keep creating.`, !result.reloadWarning); }
    catch (error) { this.status(String(error)); } finally { this.setBusy(false); }
  }
  private refreshApproved(): void {
    const names = [...this.approved.keys()]; $("studio-approved").textContent = names.length ? `Imported: ${names.map(friendlyPetName).join(", ")}` : "No imported animations yet."; this.workflow.refreshMappings(names); this.syncControls();
  }
  private show(id: string, source: string): Promise<void> { return showStudioImage($<HTMLImageElement>(id), source); }
  private animationIdFromFilename(fileName: string, petId: string): string {
    let base = fileName.replace(/\.(?:apng|png)$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48).replace(/-+$/g, "");
    if (!base) base = "animation";
    if (!/^[a-z]/.test(base)) base = `animation-${base}`.slice(0, 48);
    const used = new Set([...Object.keys(behaviorPackForCharacter(petId).clips), ...this.approved.keys()]);
    if (!used.has(base)) return base;
    for (let suffix = 2; ; suffix += 1) {
      const ending = `-${suffix}`;
      const candidate = `${base.slice(0, 48 - ending.length).replace(/-+$/g, "")}${ending}`;
      if (!used.has(candidate)) return candidate;
    }
  }
  private animationId(): string { const input = $<HTMLInputElement>("studio-animation-id"); const id = input.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); input.value = id; return id; }
}
