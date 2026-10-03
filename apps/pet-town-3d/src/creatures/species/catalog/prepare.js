import { createHushDefinition } from "./create-hush-definition.js";
import { createDriftDefinition } from "./create-drift-definition.js";
import { createSkimDefinition } from "./create-skim-definition.js";
import { createTuftletDefinition } from "./create-tuftlet-definition.js";
import { createJellopDefinition } from "./create-jellop-definition.js";
import { createPebbugDefinition } from "./create-pebbug-definition.js";
import { createLumbleDefinition } from "./create-lumble-definition.js";
import { createPondleDefinition } from "./create-pondle-definition.js";
import { createFiddlekitDefinition } from "./create-fiddlekit-definition.js";
import { createNimbaaDefinition } from "./create-nimbaa-definition.js";
/** Species metadata, habitat and motion settings, population counts and palette variants. */
import { creaturesState } from "../../state.js";
export function prepareCreaturesSpeciesCatalog() {
  creaturesState.creatureSpeciesDefinitions = [
    createNimbaaDefinition(),
    createFiddlekitDefinition(),
    createPondleDefinition(),
    createLumbleDefinition(),
    createPebbugDefinition(),
    createJellopDefinition(),
    createTuftletDefinition(),
    createSkimDefinition(),
    createDriftDefinition(),
    createHushDefinition(),
  ];
}
