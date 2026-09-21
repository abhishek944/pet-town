import { invoke } from "@tauri-apps/api/core"; import { characterDisplayName } from "./character-packs"; import { friendlyPetName } from "./preferences-types"; import { saveExtension, type ExtensionSaveResult, type MenuAction } from "./settings-studio-extension";
import { StudioOrchestrator } from "./studio-orchestrator"; import { renderStudioActions } from "./settings-studio-actions"; import { showStudioImage } from "./settings-studio-media"; import { setStudioBusy, type StudioBusyOperation, waitForStudioPaint } from "./settings-studio-progress"; import { advanceStudioWizard } from "./settings-studio-steps"; import { bindStudioValidationClear, showStudioValidation } from "./settings-studio-validation"; import { StudioWorkflow } from "./settings-studio-workflow"; import { StudioWizard } from "./settings-studio-wizard";
type DraftView = { draftId: string; displayName: string }; type AnimationAssetView = { animationId: string; dataUrl: string }; type DraftDiscardResult = { cleanupWarning: string | null };
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T; const slots = ["walk", "work", "blocked", "celebrate", "sleep", "unknown"] as const;

export class PetStudio {
  private draftId = ""; private approved = new Map<string, string>(); private actions: MenuAction[] = []; private busy = false;
  private orchestrator = new StudioOrchestrator(); private workflow: StudioWorkflow; private wizard: StudioWizard;
  constructor() {
    this.workflow = new StudioWorkflow(() => { if (this.workflow.mode() === "extend" && location.hash === "#studio-orchestrator") location.hash = "studio"; this.workflow.sync(this.draftId); this.refreshApproved(); this.syncControls(); });
    this.wizard = new StudioWizard(() => void this.advanceWizard()); this.refreshSources();
    $("studio-name").addEventListener("input", () => this.syncControls()); $("studio-existing").addEventListener("change", () => this.syncControls());
    $("studio-cancel").addEventListener("click", () => void this.cancelDraft());
    $("studio-import-animation").addEventListener("change", (event) => void this.importApng(event, this.animationId(), $<HTMLSelectElement>("studio-role").value));
    $("studio-import-walking").addEventListener("change", (event) => void this.importApng(event, "walk", "locomotion"));
    $("studio-import-listening").addEventListener("change", (event) => void this.importApng(event, "listening", "stationary"));
    $("studio-add-action").addEventListener("click", () => this.addAction()); $("studio-save").addEventListener("click", () => void this.save());
    $("studio-focus-orchestrator").addEventListener("click", () => { location.hash = location.hash === "#studio-orchestrator" ? "studio" : "studio-orchestrator"; });
    window.addEventListener("hashchange", () => this.syncRoute()); window.addEventListener("pet-studio-create-assistant-pet", () => this.status(this.workflow.startAssistantPet(this.draftId, this.busy, () => this.wizard.reset())));
    bindStudioValidationClear(); this.workflow.sync(this.draftId); this.syncRoute(); this.syncControls();
  }
  private syncRoute(): void {
    const focused = location.hash === "#studio-orchestrator"; document.body.classList.toggle("studio-orchestrator-route", focused); this.wizard.setFocusedRoute(focused);
    $("studio-heading-title").textContent = focused ? "Orchestrator animations" : "Pet Studio";
    $("studio-heading-copy").textContent = focused ? "Use your imported APNGs for Walking and Listening." : "Create a local pet from your APNG animations.";
    $("studio-focus-orchestrator").textContent = focused ? "Back to full Studio" : "Open assignment view"; $("studio-save").textContent = focused ? "Save assignments" : "Validate & save pet";
  }
  private mode() { return this.workflow.mode(); } refreshSources(): void { this.workflow.refreshSources(); }
  private status(message: string, success = false, fields: string[] = [], pending = false): void {
    showStudioValidation(message, fields); const output = $<HTMLElement>("studio-message"); output.setAttribute("aria-live", pending ? "off" : "polite"); output.textContent = message; output.dataset.success = String(success); output.dataset.pending = String(pending);
  }
  showExtensionWarning(message: string): void { this.status(message); }
  private setBusy(value: boolean, operation: StudioBusyOperation = null): void { this.busy = value; setStudioBusy(value, operation); this.syncControls(); }
  private syncControls(): void {
    const step = this.wizard.current(); const choiceReady = !("message" in this.workflow.choice()); const nextReady = step === 0 ? Boolean(this.mode()) : step === 1 ? choiceReady : step === 2 ? this.approved.size > 0 : true;
    $<HTMLButtonElement>("studio-wizard-next").disabled = this.busy || !nextReady; $<HTMLButtonElement>("studio-wizard-previous").disabled = this.busy || step === 0; $("studio-cancel").hidden = !this.draftId;
    $<HTMLButtonElement>("studio-add-action").disabled = this.busy || !this.draftId || this.approved.size === 0; $<HTMLButtonElement>("studio-save").disabled = this.busy || !this.draftId;
    document.querySelectorAll<HTMLButtonElement>(".studio-action-chip").forEach((button) => { button.disabled = this.busy; });
    $<HTMLElement>("panel-studio").querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea").forEach((control) => { control.disabled = this.busy; }); this.workflow.lock(this.busy, this.draftId);
  }
  private resetDraftState(): void {
    document.body.classList.remove("studio-has-draft"); this.approved.clear(); this.actions = []; this.orchestrator.reset();
    const preview = $<HTMLImageElement>("studio-apng-preview"); preview.hidden = true; preview.removeAttribute("src"); $("studio-animation-step").hidden = true; $("studio-map-step").hidden = true; this.refreshApproved(); this.refreshActions();
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
    if (!this.draftId || !file || this.busy) { this.status("Start a draft before importing APNGs."); input.value = ""; return; }
    if (!/^[a-z][a-z0-9-]*$/.test(animationId)) { this.status("Enter an animation name that starts with a letter.", false, ["studio-animation-id"]); input.value = ""; return; }
    this.setBusy(true, "import-animation"); this.status(`Importing and validating ${file.name}…`, false, [], true); await waitForStudioPaint();
    try {
      const apngDataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read the APNG.")); reader.readAsDataURL(file); });
      const asset = await invoke<AnimationAssetView>("import_pet_animation", { request: { draftId: this.draftId, animationId, apngDataUrl, role } }); await this.show("studio-apng-preview", asset.dataUrl); this.approved.set(animationId, asset.dataUrl); this.refreshApproved();
      if (this.mode() === "new" && this.approved.has("walk") && this.approved.has("listening")) for (const slot of slots) { const target = $<HTMLSelectElement>(`studio-map-${slot}`); if (!target.value) target.value = slot === "walk" ? "walk" : "listening"; }
      this.status(`${friendlyPetName(animationId)} APNG imported and validated.`, true);
    } catch (error) { this.status(`${file.name}: ${String(error)}`); } finally { this.setBusy(false); input.value = ""; }
  }
  private addAction(): void {
    const input = $<HTMLInputElement>("studio-action-id"); const id = input.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); input.value = id;
    const label = $<HTMLInputElement>("studio-action-label").value.trim(); const animationId = $<HTMLSelectElement>("studio-action-animation").value;
    if (!/^[a-z][a-z0-9-]*$/.test(id) || !label || !animationId) { const fields = [...(!/^[a-z][a-z0-9-]*$/.test(id) ? ["studio-action-id"] : []), ...(!label ? ["studio-action-label"] : []), ...(!animationId ? ["studio-action-animation"] : [])]; this.status("Enter an action ID starting with a letter, a label, and an imported animation.", false, fields); return; }
    const existingIds = this.mode() === "extend" ? this.workflow.existingActionIds() : []; const combinedIds = new Set([...existingIds, ...this.actions.map((action) => action.id), id]);
    if (combinedIds.size > 8) { this.status("A pet can have at most eight menu actions."); return; }
    this.actions = [...this.actions.filter((action) => action.id !== id), { id, label, animationId }]; this.refreshActions();
  }
  private async save(): Promise<void> {
    if (this.busy || !this.draftId) return; const mode = this.mode();
    if (mode === "extend") {
      if (this.approved.size === 0) { this.status("Import at least one APNG before saving the extension."); return; }
      const stateAssignments = this.workflow.stateAssignments(); this.setBusy(true, "save-pet"); this.status("Validating and saving the extension…", false, [], true); await waitForStudioPaint();
      try { const baseId = $<HTMLSelectElement>("studio-existing").value; const result = await saveExtension({ draftId: this.draftId, baseId, stateAssignments, actions: this.actions }); this.draftId = ""; this.resetDraftState(); this.workflow.sync(""); this.wizard.reset(); const name = characterDisplayName(result.id) ?? friendlyPetName(result.id); this.status(result.reloadWarning ?? `Extended ${name}. The village has reloaded it.`, !result.reloadWarning); }
      catch (error) { this.status(String(error)); } finally { this.setBusy(false); } return;
    }
    const mapping = Object.fromEntries(slots.map((slot) => [slot, $<HTMLSelectElement>(`studio-map-${slot}`).value])); const missingMappings = slots.filter((slot) => !mapping[slot]).map((slot) => `studio-map-${slot}`);
    if (missingMappings.length) { this.status("Assign an imported animation to all six behavior slots.", false, missingMappings); return; }
    if (!this.orchestrator.valid()) { this.status("Choose different imported animations for Walking and Listening.", false, ["studio-orchestrator-walk", "studio-orchestrator-listening"]); return; }
    this.setBusy(true, "save-pet"); this.status("Validating and saving the pet…", false, [], true); await waitForStudioPaint();
    try { const result = await invoke<ExtensionSaveResult>("save_pet_pack", { request: { draftId: this.draftId, displayName: $<HTMLInputElement>("studio-name").value.trim(), ...mapping, ...this.orchestrator.selection(), actions: this.actions } }); this.draftId = ""; this.resetDraftState(); this.workflow.sync(""); this.wizard.reset(); this.status(result.reloadWarning ?? `Saved ${result.id}. It is now available in the village. Start a new draft to keep creating.`, !result.reloadWarning); }
    catch (error) { this.status(String(error)); } finally { this.setBusy(false); }
  }
  private refreshApproved(): void {
    const names = [...this.approved.keys()]; $("studio-approved").textContent = names.length ? `Imported: ${names.map(friendlyPetName).join(", ")}` : "No imported animations yet."; this.workflow.refreshMappings(names); this.orchestrator.update(this.approved); this.options($<HTMLSelectElement>("studio-action-animation"), names); this.syncControls();
  }
  private refreshActions(): void { renderStudioActions(this.actions, (id) => { this.actions = this.actions.filter((item) => item.id !== id); this.refreshActions(); }); }
  private options(select: HTMLSelectElement, names: string[]): void { const value = select.value; select.replaceChildren(new Option("Choose…", ""), ...names.map((name) => new Option(friendlyPetName(name), name))); select.value = names.includes(value) ? value : ""; }
  private show(id: string, source: string): Promise<void> { return showStudioImage($<HTMLImageElement>(id), source); }
  private animationId(): string { const input = $<HTMLInputElement>("studio-animation-id"); const id = input.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); input.value = id; return id; }
}
