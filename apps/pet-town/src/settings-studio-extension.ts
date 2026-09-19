import { invoke } from "@tauri-apps/api/core";
import { compilePetExtension, type PetExtensionPayload } from "./character-packs";

export type MenuAction = { id: string; label: string; animationId: string };
type Candidate = { candidateId: string; extension: PetExtensionPayload };
export type ExtensionSaveResult = { id: string; reloadWarning: string | null };
type SaveInput = {
  draftId: string;
  baseId: string;
  stateAssignments: Record<string, string>;
  actions: MenuAction[];
};

export async function saveExtension(input: SaveInput): Promise<ExtensionSaveResult> {
  let candidate: Candidate | null = null;
  try {
    candidate = await invoke<Candidate>("save_pet_extension", { request: input });
    const compilation = compilePetExtension(candidate.extension);
    if (!compilation.pack) {
      await invoke("discard_pet_extension_candidate", {
        request: { baseId: input.baseId, candidateId: candidate.candidateId },
      });
      candidate = null;
      throw new Error(
        `Extension is not compatible: ${compilation.diagnostics.map((item) => item.message).join("; ")}`,
      );
    }
    const result = await invoke<ExtensionSaveResult>("activate_pet_extension", {
      request: { draftId: input.draftId, baseId: input.baseId, candidateId: candidate.candidateId },
    });
    candidate = null;
    return result;
  } catch (error) {
    if (candidate) {
      void invoke("discard_pet_extension_candidate", {
        request: { baseId: input.baseId, candidateId: candidate.candidateId },
      }).catch(() => {});
    }
    throw error;
  }
}
