import { invoke } from "@tauri-apps/api/core";
import {
  clonePreferences,
  preferencesEqual,
  type PreferencesFile,
  type PreferencesSnapshot,
} from "../preferences-types";
import { mergeAppliedDraft, settingsMessage, shouldShowApplyError } from "../settings-apply";
import { byId } from "../settings-dom";
import { mergeLocalPreferenceEdits } from "../settings-three-way";

/** Owns the editable draft and protects it from stale Apply/reload results. */
export class SettingsDraft {
  snapshot!: PreferencesSnapshot;
  preferences!: PreferencesFile;
  message = "";
  messageTone: "success" | "info" | "error" = "error";
  private applyGeneration = 0;
  private applying = false;

  constructor(
    private readonly render: () => void,
    private readonly selectPreviewAnimations: () => void,
  ) {}

  prepareInstallBlockReason(): string | null {
    if (!this.snapshot || !this.preferences)
      return "Settings are still loading; wait before installing.";
    if (this.applying) return "Pet Town is applying preferences; wait for Apply to finish.";
    if (!preferencesEqual(this.preferences, this.snapshot.preferences)) {
      return "Apply your unapplied Settings changes before installing.";
    }
    return null;
  }

  installSnapshot(next: PreferencesSnapshot, preserveDraft: boolean): boolean {
    if (this.snapshot && next.revision < this.snapshot.revision) return false;
    if (!next.petIds.length) throw new Error("No pets are available in this version.");
    const pending = preserveDraft && this.preferences ? this.preferences : null;
    const previous = pending ? this.snapshot.preferences : next.preferences;
    this.snapshot = next;
    this.applyGeneration += 1;
    this.applying = false;
    this.message = "";
    this.messageTone = "error";
    this.preferences = pending
      ? mergeLocalPreferenceEdits(previous, pending, next.preferences)
      : clonePreferences(next.preferences);
    return true;
  }

  async apply(selectedPetId: string, rememberSelection = true): Promise<void> {
    if (rememberSelection) this.preferences.app.lastSelectedPetId = selectedPetId;
    const generation = ++this.applyGeneration;
    const submitted = clonePreferences(this.preferences);
    const expectedRevision = this.snapshot.revision;
    this.applying = true;
    this.render();
    try {
      const applied = await invoke<PreferencesSnapshot>("apply_preferences", {
        draft: submitted,
        expectedRevision,
      });
      if (applied.revision >= this.snapshot.revision) {
        const merged = mergeAppliedDraft(this.preferences, submitted, applied);
        this.snapshot = applied;
        this.preferences = merged.draft;
        this.selectPreviewAnimations();
        if (generation === this.applyGeneration) {
          this.message = merged.message;
          this.messageTone = "info";
        }
      }
    } catch (error) {
      if (
        shouldShowApplyError(
          generation,
          this.applyGeneration,
          this.snapshot.revision,
          expectedRevision,
        )
      ) {
        this.message = String(error);
        this.messageTone = "error";
      }
    }
    if (generation === this.applyGeneration) {
      this.applying = false;
      this.render();
    }
  }

  renderActions(): void {
    const changed = !preferencesEqual(this.preferences, this.snapshot.preferences);
    byId<HTMLButtonElement>("apply").disabled = this.applying || !changed || this.snapshot.readOnly;
    byId<HTMLButtonElement>("reset-pet").disabled = this.snapshot.readOnly;
    byId<HTMLButtonElement>("reset-all").disabled = this.applying || this.snapshot.readOnly;
    byId<HTMLElement>("dirty").hidden = !changed;
    const message = byId<HTMLElement>("message");
    message.textContent = settingsMessage(this.message, this.snapshot.warning);
    message.dataset.tone = this.snapshot.warning ? "error" : this.messageTone;
  }
}
