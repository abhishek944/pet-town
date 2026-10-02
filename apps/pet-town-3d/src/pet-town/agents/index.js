import { visibleTownAgents } from "./snapshot.js";
import { createAgent } from "./create-agent.js";
import { updateAgent } from "./update-agent.js";
import { createPetAssignments } from "./pet-assignments.js";
import { createAgentVisual, replaceAgentVisual } from "./character-visual.js";
import { getPetDefinition } from "../pets/catalog.js";

/** Independent broker companions. The game's original player and animals remain intact. */
export function createTownAgents(context) {
  const records = new Map();
  const assignments = createPetAssignments();
  let disposed = false;
  return {
    records,
    reconcile(snapshot) {
      if (disposed) return;
      const visible = visibleTownAgents(snapshot);
      if (!visible) return;
      for (const [id, record] of records) {
        if (visible.has(id)) continue;
        record._dispose();
        records.delete(id);
      }
      for (const [id, metadata] of visible) {
        const existing = records.get(id);
        if (existing) {
          Object.assign(existing, metadata);
          existing.root.name = `Town companion: ${existing.label}`;
        } else {
          records.set(
            id,
            createAgent(context, metadata, records, assignments.get(id, metadata.isMayor)),
          );
        }
      }
    },
    setPet(id, petId) {
      const record = records.get(id);
      if (disposed || !record) throw new Error("That companion has left the town. Choose another.");
      if (!getPetDefinition(petId)) throw new Error("That pet is not available. Choose another.");
      const visual = createAgentVisual(record, petId);
      try {
        assignments.set(id, petId);
      } catch (error) {
        visual._dispose();
        throw error;
      }
      replaceAgentVisual(context, record, visual);
    },
    update(deltaTime) {
      if (disposed || !Number.isFinite(deltaTime) || deltaTime <= 0) return;
      const dt = Math.min(deltaTime, 0.1);
      for (const record of records.values()) updateAgent(record, context, dt, records);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const record of records.values()) record._dispose();
      records.clear();
    },
  };
}
