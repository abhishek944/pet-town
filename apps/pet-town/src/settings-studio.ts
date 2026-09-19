import { invoke } from "@tauri-apps/api/core"; import { characterDisplayName } from "./character-packs"; import { friendlyPetName } from "./preferences-types"; import { saveExtension, type ExtensionSaveResult, type MenuAction } from "./settings-studio-extension";
import { StudioOrchestrator } from "./studio-orchestrator"; import { renderStudioActions } from "./settings-studio-actions"; import { loadPartialFrames, type AnimationFramesView } from "./settings-studio-candidate"; import { renderFrameGrid } from "./settings-studio-frames"; import { showStudioImage } from "./settings-studio-media"; import { setStudioBusy, type StudioBusyOperation, waitForStudioPaint } from "./settings-studio-progress"; import { advanceStudioWizard } from "./settings-studio-steps"; import { loadStudioApiStatus } from "./settings-studio-status"; import { bindStudioValidationClear, showStudioValidation } from "./settings-studio-validation"; import { existingPetReference, StudioWorkflow } from "./settings-studio-workflow"; import { StudioWizard } from "./settings-studio-wizard";
type DraftView = { draftId: string; displayName: string }; type AssetView = { dataUrl: string }; type AnimationAssetView = AssetView & { animationId: string }; type AnimationRestoreView = { apngDataUrl: string; frameDataUrls: string[] }; type DraftDiscardResult = { cleanupWarning: string | null };
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T; const slots = ["walk", "work", "blocked", "celebrate", "sleep", "unknown"] as const;
export class PetStudio {
  private draftId = ""; private approved = new Map<string, string>(); private created = new Map<string, string>(); private actions: MenuAction[] = [];
  private busy = false; private apiReady = false; private pendingAnimationId = ""; private referenceLocked = false; private generated = new Map<string, string[]>(); private generatedRoles = new Map<string, string>(); private candidates = new Set<string>(); private orchestrator = new StudioOrchestrator(); private workflow: StudioWorkflow; private wizard: StudioWizard;
  constructor() {
    this.workflow = new StudioWorkflow(() => { if (this.workflow.mode() === "extend" && location.hash === "#studio-orchestrator") location.hash = "studio"; this.workflow.sync(this.draftId); this.refreshApproved(); this.syncControls(); });
    this.wizard = new StudioWizard(() => void this.advanceWizard());
    this.refreshSources(); ["studio-name", "studio-character-prompt"].forEach((id) => $(id).addEventListener("input", () => this.syncControls())); ["studio-source", "studio-existing"].forEach((id) => $(id).addEventListener("change", () => this.syncControls()));
    $("studio-start").addEventListener("click", () => void this.startDraft()); $("studio-cancel").addEventListener("click", () => void this.cancelDraft());
    $("studio-import-animation").addEventListener("change", (event) => void this.importApng(event, this.animationId(), $<HTMLSelectElement>("studio-role").value));
    $("studio-import-walking").addEventListener("change", (event) => void this.importApng(event, "walk", "locomotion"));
    $("studio-import-listening").addEventListener("change", (event) => void this.importApng(event, "listening", "stationary"));
    $("studio-reference-generate").addEventListener("click", () => void this.generateReference());
    $("studio-generate-animation").addEventListener("click", () => void this.generateAnimation());
    $("studio-create-animation").addEventListener("click", () => void this.createAnimation()); $("studio-approve-animation").addEventListener("click", () => void this.approveAnimation());
    $("studio-discard-animation").addEventListener("click", () => void this.discardAnimation());
    $("studio-add-action").addEventListener("click", () => this.addAction());
    $("studio-save").addEventListener("click", () => void this.save());
    $("studio-focus-orchestrator").addEventListener("click", () => {
      location.hash = location.hash === "#studio-orchestrator" ? "studio" : "studio-orchestrator";
    });
    window.addEventListener("hashchange", () => this.syncRoute());
    window.addEventListener("pet-studio-create-assistant-pet", () => this.status(this.workflow.startAssistantPet(this.draftId, this.busy, () => this.wizard.reset())));
    bindStudioValidationClear(); this.workflow.sync(this.draftId); this.syncRoute(); this.syncControls(); void loadStudioApiStatus().then((ready) => { this.apiReady = ready; this.syncControls(); });
  }
  private syncRoute(): void {
    const focused = location.hash === "#studio-orchestrator";
    document.body.classList.toggle("studio-orchestrator-route", focused); this.wizard.setFocusedRoute(focused);
    $("studio-heading-title").textContent = focused ? "Orchestrator animations" : "Pet Studio";
    $("studio-heading-copy").textContent = focused ? "Use your reviewed APNGs for Walking and Listening." : "Create a local pet from reviewed animation frames.";
    $("studio-focus-orchestrator").textContent = focused ? "Back to full Studio" : "Open assignment view";
    $("studio-save").textContent = focused ? "Save assignments" : "Validate & save pet";
  }
  private mode() { return this.workflow.mode(); } refreshSources(): void { this.workflow.refreshSources(); }
  private status(message: string, success = false, fields: string[] = [], pending = false): void {
    showStudioValidation(message, fields); const output = $<HTMLElement>("studio-message"); output.setAttribute("aria-live", pending ? "off" : "polite"); output.textContent = message; output.dataset.success = String(success); output.dataset.pending = String(pending);
  }
  showExtensionWarning(message: string): void { this.status(message); }
  private setBusy(value: boolean, operation: StudioBusyOperation = null): void { this.busy = value; setStudioBusy(value, operation); this.syncControls(); }
  private syncControls(): void {
    const step = this.wizard.current(); const choice = this.workflow.choice(); const choiceReady = !("message" in choice); const needsNewReference = step === 1 && this.mode() === "new" && $<HTMLSelectElement>("studio-reference-kind").value === "new"; const referenceReady = !$<HTMLImageElement>("studio-reference-preview").hidden; const promptReady = Boolean($<HTMLTextAreaElement>("studio-character-prompt").value.trim()); const nextReady = step === 0 ? Boolean(this.mode()) : step === 1 ? choiceReady && (!needsNewReference || referenceReady) : step === 2 ? this.approved.size > 0 : true;
    $<HTMLButtonElement>("studio-start").disabled = this.busy;
    $<HTMLButtonElement>("studio-wizard-next").disabled = this.busy || !nextReady;
    $<HTMLButtonElement>("studio-wizard-previous").disabled = this.busy || this.wizard.current() === 0;
    $("studio-cancel").hidden = !this.draftId;
    $<HTMLButtonElement>("studio-reference-generate").disabled = this.busy || !this.apiReady || this.referenceLocked || !needsNewReference || !choiceReady || !promptReady;
    $<HTMLButtonElement>("studio-generate-animation").disabled = this.busy || !this.draftId || !this.apiReady;
    $<HTMLButtonElement>("studio-create-animation").disabled = this.busy || !this.draftId || this.generated.get(this.pendingAnimationId)?.length !== 6 || !this.generatedRoles.has(this.pendingAnimationId) || !this.candidates.has(this.pendingAnimationId) || $<HTMLElement>("studio-frame-preview").dataset.ready !== "true"; $<HTMLButtonElement>("studio-approve-animation").disabled = this.busy || !this.created.has(this.pendingAnimationId);
    $<HTMLButtonElement>("studio-discard-animation").disabled = this.busy || !this.draftId || !this.candidates.has(this.pendingAnimationId);
    $<HTMLButtonElement>("studio-add-action").disabled = this.busy || !this.draftId || this.approved.size === 0;
    $<HTMLButtonElement>("studio-save").disabled = this.busy || !this.draftId;
    document.querySelectorAll<HTMLButtonElement>(".studio-action-chip").forEach((button) => { button.disabled = this.busy; });
    $<HTMLElement>("panel-studio").querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea").forEach((control) => { control.disabled = this.busy; });
    $<HTMLSelectElement>("studio-role").disabled = this.busy || this.generatedRoles.has(this.pendingAnimationId);
    this.workflow.lock(this.busy, this.draftId);
  }
  private resetDraftState(): void {
    document.body.classList.remove("studio-has-draft");
    this.approved.clear(); this.created.clear(); this.actions = []; this.generated.clear(); this.generatedRoles.clear(); this.candidates.clear(); this.pendingAnimationId = ""; this.referenceLocked = false; this.orchestrator.reset();
    ["studio-reference-preview", "studio-apng-preview"].forEach((id) => { const image = $<HTMLImageElement>(id); image.hidden = true; image.removeAttribute("src"); });
    void renderFrameGrid("studio-frame-preview", []); $("studio-animation-step").hidden = true; $("studio-map-step").hidden = true;
    this.refreshApproved(); this.refreshActions();
  }
  private async cancelDraft(): Promise<void> {
    if (!this.draftId || this.busy) return; this.setBusy(true, "discard-draft"); this.status("Discarding the pet draft…", false, [], true); await waitForStudioPaint();
    try { const result = await invoke<DraftDiscardResult>("discard_pet_draft", { request: { draftId: this.draftId } }); this.draftId = ""; this.resetDraftState(); this.workflow.sync(""); this.wizard.reset(); this.status(result.cleanupWarning ?? "Draft discarded. Choose what to make next.", !result.cleanupWarning); }
    catch (error) { this.status(String(error)); } finally { this.setBusy(false); }
  }
  private async advanceWizard(): Promise<void> {
    await advanceStudioWizard({ wizard: this.wizard, mode: this.mode(), draftId: () => this.draftId, startDraft: () => this.startDraft(), referenceReady: () => !$<HTMLImageElement>("studio-reference-preview").hidden, approvedCount: () => this.approved.size, status: (message, success, fields) => this.status(message, success, fields), syncControls: () => this.syncControls() });
  }
  private async startDraft(operation: StudioBusyOperation = "prepare-draft"): Promise<boolean> {
    if (this.busy) return false;
    const choice = this.workflow.choice();
    if ("message" in choice) { this.status(choice.message, false, choice.fields); return false; }
    const { mode, name, referenceId } = choice;
    if (this.draftId) { this.status("Cancel the current draft before starting another."); return false; }
    this.setBusy(true, operation); this.status("Preparing the pet draft…", false, [], true); await waitForStudioPaint();
    try {
      const draft = await invoke<DraftView>("create_pet_draft", { request: { displayName: name } }); this.resetDraftState(); this.draftId = draft.draftId;
      document.body.classList.add("studio-has-draft");
      $<HTMLElement>("panel-studio").dataset.mode = mode;
      this.workflow.renderMappings([]);
      if (referenceId) {
        const pngDataUrl = await existingPetReference(referenceId);
        const asset = await invoke<AssetView>("set_pet_reference", { request: { draftId: this.draftId, pngDataUrl } });
        await this.show("studio-reference-preview", asset.dataUrl);
        this.status(mode === "extend" ? `Ready to add animations to ${name}.` : "Character reference loaded. Select Next to continue.", true);
      } else { this.status("Draft ready. Generate and review the character reference.", true); }
      return true;
    } catch (error) { this.status(String(error)); return false; } finally { this.setBusy(false); }
  }
  private async importApng(event: Event, animationId: string, role: string): Promise<void> {
    const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0];
    if (!this.draftId || !file || this.busy) { this.status("Start a draft before importing APNGs."); input.value = ""; return; }
    if (!animationId) { this.status("Enter an animation name before importing an APNG.", false, ["studio-animation-id"]); input.value = ""; return; }
    this.setBusy(true, "import-animation"); this.status(`Importing and validating ${file.name}…`, false, [], true); await waitForStudioPaint();
    try {
      const apngDataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read the APNG.")); reader.readAsDataURL(file); });
      const asset = await invoke<AnimationAssetView>("import_pet_animation", { request: { draftId: this.draftId, animationId, apngDataUrl, role } });
      this.generated.delete(animationId); this.generatedRoles.delete(animationId); this.showAnimationDraft("");
      await this.show("studio-apng-preview", asset.dataUrl); this.approved.set(animationId, asset.dataUrl); this.created.delete(animationId); this.candidates.delete(animationId); this.refreshApproved();
      if (this.mode() === "new") {
        for (const slot of slots) { const target = $<HTMLSelectElement>(`studio-map-${slot}`); if (!target.value) target.value = slot === "walk" ? "walk" : "listening"; }
      }
      this.status(`${friendlyPetName(animationId)} APNG imported and approved.`, true);
    } catch (error) { this.status(`${file.name}: ${String(error)}`); } finally { this.setBusy(false); input.value = ""; }
  }
  private async generateReference(): Promise<void> {
    const prompt = $<HTMLTextAreaElement>("studio-character-prompt").value.trim(); if (!prompt || this.busy) { this.status("Describe the character before generating its reference.", false, !prompt ? ["studio-character-prompt"] : []); return; }
    if (!this.draftId && !(await this.startDraft("generate-reference"))) return; this.setBusy(true, "generate-reference"); this.status("Generating the character reference…", false, [], true); await waitForStudioPaint();
    try { const asset = await invoke<AssetView>("generate_pet_reference", { request: { draftId: this.draftId, prompt, model: this.model(), quality: this.quality() } }); await this.show("studio-reference-preview", asset.dataUrl); this.status("Reference generated and ready to review. Select Next when it looks right.", true); }
    catch (error) { this.status(String(error)); } finally { this.setBusy(false); }
  }
  private async generateAnimation(): Promise<void> {
    const animationId = this.animationId(); const prompt = $<HTMLTextAreaElement>("studio-animation-prompt").value.trim();
    if (!this.draftId || !/^[a-z][a-z0-9-]*$/.test(animationId) || !prompt || this.busy) { const fields = [...(!/^[a-z][a-z0-9-]*$/.test(animationId) ? ["studio-animation-id"] : []), ...(!prompt ? ["studio-animation-prompt"] : [])]; this.status("Enter an animation name that starts with a letter and a physical action.", false, fields); return; }
    this.generated.delete(animationId); this.generatedRoles.delete(animationId); this.created.delete(animationId); this.candidates.add(animationId); this.referenceLocked = true; this.showAnimationDraft(animationId);
    this.setBusy(true, "generate-sheet"); this.status("Generating one transparent sprite sheet and preparing six frames…", false, [], true); await waitForStudioPaint();
    try { const asset = await invoke<AnimationFramesView>("generate_pet_animation", { request: { draftId: this.draftId, animationId, prompt, role: $<HTMLSelectElement>("studio-role").value, model: this.model(), quality: this.quality() } }); this.generated.set(asset.animationId, asset.dataUrls); this.generatedRoles.set(asset.animationId, asset.role); this.refreshApproved(); await renderFrameGrid("studio-frame-preview", asset.dataUrls); $<HTMLImageElement>("studio-apng-preview").hidden = true; this.status("All six frames are loaded. Review them, then create and approve the APNG.", true); }
    catch (error) { const partial = await loadPartialFrames(this.draftId, animationId).catch(() => null); if (partial) { this.generated.set(animationId, partial.dataUrls); this.generatedRoles.set(animationId, partial.role); $<HTMLSelectElement>("studio-role").value = partial.role; await renderFrameGrid("studio-frame-preview", partial.dataUrls).catch(() => undefined); } else { this.candidates.delete(animationId); this.pendingAnimationId = ""; this.referenceLocked = this.approved.size > 0; } this.status(`${String(error)}${partial ? ` ${partial.dataUrls.length} frame(s) saved; retry to continue.` : ""}`); }
    finally { this.setBusy(false); }
  }
  private async createAnimation(): Promise<void> { const animationId = this.pendingAnimationId; if (!animationId || this.busy) return; this.setBusy(true, "create-animation"); this.status("Creating the APNG from six aligned frames…", false, [], true); await waitForStudioPaint();
    try { const asset = await invoke<AssetView>("assemble_pet_animation", { request: { draftId: this.draftId, animationId, durationMs: Number($<HTMLInputElement>("studio-duration").value), role: $<HTMLSelectElement>("studio-role").value } }); await this.show("studio-apng-preview", asset.dataUrl); this.created.set(animationId, asset.dataUrl); this.candidates.add(animationId); this.syncControls(); this.status("APNG created and loaded. Review the loop, then approve the animation.", true); } catch (error) { this.status(String(error)); } finally { this.setBusy(false); }
  }
  private async approveAnimation(): Promise<void> { const animationId = this.pendingAnimationId; const source = this.created.get(animationId); if (!source || this.busy) return; this.setBusy(true, "approve-animation"); this.status("Approving the animation…", false, [], true); await waitForStudioPaint();
    try { const asset = await invoke<AssetView>("approve_pet_animation", { request: { draftId: this.draftId, animationId } }); this.created.delete(animationId); this.candidates.delete(animationId); this.generatedRoles.delete(animationId); this.approved.set(animationId, asset.dataUrl); this.refreshApproved(); this.status(`${friendlyPetName(animationId)} approved.`, true); } catch (error) { this.status(String(error)); } finally { this.setBusy(false); }
  }
  private async discardAnimation(): Promise<void> {
    const animationId = this.pendingAnimationId; if (!this.candidates.has(animationId) || this.busy) return; this.setBusy(true, "discard-animation"); this.status("Discarding the draft animation…", false, [], true); await waitForStudioPaint();
    try {
      const asset = await invoke<AnimationRestoreView | null>("discard_pet_animation_candidate", { request: { draftId: this.draftId, animationId, durationMs: 900, role: "stationary" } });
      this.candidates.delete(animationId); this.created.delete(animationId); this.generatedRoles.delete(animationId);
      if (asset) { this.approved.set(animationId, asset.apngDataUrl); if (asset.frameDataUrls.length) this.generated.set(animationId, asset.frameDataUrls); else this.generated.delete(animationId); this.pendingAnimationId = animationId; }
      else { this.generated.delete(animationId); this.pendingAnimationId = ""; } this.showAnimationDraft(this.pendingAnimationId); this.refreshApproved(); this.status(asset ? "Replacement discarded; approved animation restored." : "Draft animation discarded.", true);
    } catch (error) { this.status(String(error)); } finally { this.setBusy(false); }
  }
  private addAction(): void {
    const input = $<HTMLInputElement>("studio-action-id"); const id = input.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); input.value = id;
    const label = $<HTMLInputElement>("studio-action-label").value.trim(); const animationId = $<HTMLSelectElement>("studio-action-animation").value;
    if (!/^[a-z][a-z0-9-]*$/.test(id) || !label || !animationId) { const fields = [...(!/^[a-z][a-z0-9-]*$/.test(id) ? ["studio-action-id"] : []), ...(!label ? ["studio-action-label"] : []), ...(!animationId ? ["studio-action-animation"] : [])]; this.status("Enter an action ID starting with a letter, a label, and an approved animation.", false, fields); return; }
    const existingIds = this.mode() === "extend" ? this.workflow.existingActionIds() : [];
    const combinedIds = new Set([...existingIds, ...this.actions.map((action) => action.id), id]);
    if (combinedIds.size > 8) { this.status("A pet can have at most eight menu actions."); return; }
    this.actions = [...this.actions.filter((action) => action.id !== id), { id, label, animationId }]; this.refreshActions();
  }
  private async save(): Promise<void> {
    if (this.busy || !this.draftId) return;
    const mode = this.mode();
    if (mode === "extend") {
      if (this.approved.size === 0) { this.status("Approve at least one new APNG before saving the extension."); return; }
      const stateAssignments = this.workflow.stateAssignments();
      this.setBusy(true, "save-pet"); this.status("Validating and saving the extension…", false, [], true); await waitForStudioPaint();
      try {
        const baseId = $<HTMLSelectElement>("studio-existing").value;
        const result = await saveExtension({ draftId: this.draftId, baseId, stateAssignments, actions: this.actions });
        this.draftId = ""; this.resetDraftState(); this.workflow.sync(""); this.wizard.reset();
        const name = characterDisplayName(result.id) ?? friendlyPetName(result.id);
        this.status(result.reloadWarning ?? `Extended ${name}. The village has reloaded it.`, !result.reloadWarning);
      } catch (error) { this.status(String(error)); } finally { this.setBusy(false); }
      return;
    }
    const mapping = Object.fromEntries(slots.map((slot) => [slot, $<HTMLSelectElement>(`studio-map-${slot}`).value]));
    const missingMappings = slots.filter((slot) => !mapping[slot]).map((slot) => `studio-map-${slot}`);
    if (missingMappings.length) { this.status("Assign an approved animation to all six behavior slots.", false, missingMappings); return; }
    if (!this.orchestrator.valid()) { this.status("Choose different approved animations for Walking and Listening.", false, ["studio-orchestrator-walk", "studio-orchestrator-listening"]); return; }
    this.setBusy(true, "save-pet"); this.status("Validating and saving the pet…", false, [], true); await waitForStudioPaint();
    try { const result = await invoke<ExtensionSaveResult>("save_pet_pack", { request: { draftId: this.draftId, displayName: $<HTMLInputElement>("studio-name").value.trim(), ...mapping, ...this.orchestrator.selection(), actions: this.actions } }); this.draftId = ""; this.resetDraftState(); this.workflow.sync(""); this.wizard.reset(); this.status(result.reloadWarning ?? `Saved ${result.id}. It is now available in the village. Start a new draft to keep creating.`, !result.reloadWarning); }
    catch (error) { this.status(String(error)); } finally { this.setBusy(false); }
  }
  private refreshApproved(): void {
    const names = [...this.approved.keys()]; $("studio-approved").textContent = names.length ? `Approved: ${names.map(friendlyPetName).join(", ")}` : "No approved animations yet.";
    this.workflow.refreshMappings(names); this.orchestrator.update(this.approved);
    this.options($<HTMLSelectElement>("studio-action-animation"), names); this.syncControls();
  }
  private showAnimationDraft(animationId: string): void {
    this.pendingAnimationId = animationId; const sources = this.generated.get(animationId) ?? [];
    const generatedRole = this.generatedRoles.get(animationId); if (generatedRole) $<HTMLSelectElement>("studio-role").value = generatedRole;
    void renderFrameGrid("studio-frame-preview", sources).then(() => this.syncControls()).catch(() => this.status("The generated frames could not be displayed. Retry generation before creating the APNG."));
    const apngSource = this.created.get(animationId) ?? (this.candidates.has(animationId) ? undefined : this.approved.get(animationId)); const apng = $<HTMLImageElement>("studio-apng-preview"); if (apngSource) void this.show("studio-apng-preview", apngSource).catch(() => undefined); else { apng.hidden = true; apng.removeAttribute("src"); } this.syncControls();
  }
  private refreshActions(): void {
    renderStudioActions(this.actions, (id) => { this.actions = this.actions.filter((item) => item.id !== id); this.refreshActions(); });
  }
  private options(select: HTMLSelectElement, names: string[]): void { const value = select.value; select.replaceChildren(new Option("Choose…", ""), ...names.map((name) => new Option(friendlyPetName(name), name))); select.value = names.includes(value) ? value : ""; }
  private show(id: string, source: string): Promise<void> { return showStudioImage($<HTMLImageElement>(id), source); }
  private animationId(): string { const input = $<HTMLInputElement>("studio-animation-id"); const id = input.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); input.value = id; return id; }
  private model(): string { return $<HTMLSelectElement>("studio-model").value; }
  private quality(): string { return $<HTMLSelectElement>("studio-quality").value; }
}
