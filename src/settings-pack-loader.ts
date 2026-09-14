import { invoke } from "@tauri-apps/api/core";
import {
  installUserPacks,
  type PetExtensionPayload,
  type UserPackPayload,
} from "./character-packs";

type PetExtensionCatalog = { extensions: PetExtensionPayload[]; warnings: string[] };

export async function loadPetPacks(): Promise<string | null> {
  const packs = await invoke<UserPackPayload[]>("list_user_pet_packs");
  try {
    const catalog = await invoke<PetExtensionCatalog>("list_pet_extensions");
    const rejected = installUserPacks(packs, catalog.extensions).rejectedExtensions;
    const warnings = [
      ...catalog.warnings,
      ...rejected.map((id) => `${id}: incompatible with its base pet`),
    ];
    return warnings.length ? `Some pet extensions were skipped: ${warnings.join("; ")}` : null;
  } catch {
    installUserPacks(packs);
    return "Some pet extensions could not be loaded. Base pets are still available.";
  }
}
