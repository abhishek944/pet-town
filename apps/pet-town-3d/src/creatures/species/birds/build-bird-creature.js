import { createCreatureRigRoot } from "../../rig-builders/create-creature-rig-root.js";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { getCreatureMaterials } from "../../materials/get-creature-materials.js";
import { buildBirdBody } from "./build-bird-body.js";
import { buildBirdHead } from "./build-bird-head.js";
import { buildBirdWings } from "./build-bird-wings.js";

export function buildBirdCreature(palette, kind) {
  const root = createCreatureRigRoot();
  const bob = createCreatureBone("bob", root);
  const body = createCreatureBone("body", bob, [0, 0.32, 0]);
  const materials = getCreatureMaterials();
  buildBirdBody(body, palette, materials, kind);
  buildBirdWings(body, palette, materials, kind);
  return { root, face: buildBirdHead(body, palette, materials, kind) };
}
