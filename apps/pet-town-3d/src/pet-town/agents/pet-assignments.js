import { persistenceState } from "../../persistence/state.js";
import { getPetDefinition, PET_CATALOG } from "../pets/catalog.js";
import { agentSeed } from "./random.js";

/** Town-only choices: keep the 2D APNG preferences and saved world independent. */
export function createPetAssignments() {
  const key = `${persistenceState.persistenceLocalStoragePrefix}companion-pets`;
  let choices = new Map();
  let readFailed = false;
  function read() {
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    const data = JSON.parse(raw);
    if (data?.v !== 1 || !data.pets || Array.isArray(data.pets) || typeof data.pets !== "object")
      throw new Error("Saved pet choices are not readable.");
    return new Map(
      Object.entries(data.pets).filter(
        ([id, petId]) => id.trim() && id.length <= 256 && getPetDefinition(petId),
      ),
    );
  }
  try {
    choices = read();
  } catch {
    readFailed = true;
  }
  return {
    get(id, isMayor = false) {
      return (
        choices.get(id) ?? (isMayor ? null : PET_CATALOG[agentSeed(id) % PET_CATALOG.length].id)
      );
    },
    set(id, petId) {
      if (!id?.trim() || id.length > 256 || !getPetDefinition(petId))
        throw new Error("Choose an available companion and pet.");
      let next;
      try {
        next = read();
        next.set(id, petId);
        localStorage.setItem(key, JSON.stringify({ v: 1, pets: Object.fromEntries(next) }));
      } catch {
        throw new Error(
          readFailed
            ? "Saved pet choices could not be read. Your companion has not changed."
            : "Your pet choice could not be saved on this device. Your companion has not changed.",
        );
      }
      readFailed = false;
      choices = next;
    },
  };
}
