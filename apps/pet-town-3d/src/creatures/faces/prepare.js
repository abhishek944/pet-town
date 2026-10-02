/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
export function prepareCreaturesFaces() {
  creaturesState.creatureFaceProjectionScratch = new THREE.Vector3();
  creaturesState.creatureFaceInkColor = 3809832;
  creaturesState.creatureEyeHighlightPatterns = {
    full: [
      {
        x: -0.34,
        y: 0.4,
        sx: 0.36,
        sy: 0.4,
      },
      {
        x: 0.36,
        y: -0.38,
        sx: 0.16,
        sy: 0.16,
      },
      {
        x: 0.1,
        y: 0.52,
        sx: 0.09,
        sy: 0.09,
      },
    ],
    single: [
      {
        x: -0.3,
        y: 0.34,
        sx: 0.3,
        sy: 0.3,
      },
    ],
    bead: [
      {
        x: -0.32,
        y: 0.36,
        sx: 0.28,
        sy: 0.28,
      },
      {
        x: 0.3,
        y: -0.3,
        sx: 0.1,
        sy: 0.1,
      },
    ],
  };
}
