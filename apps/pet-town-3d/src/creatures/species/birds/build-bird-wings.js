import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { createBirdFeather } from "./create-bird-feather.js";

/** Three overlapping feather rows; long outer primaries distinguish each silhouette. */
export function buildBirdWings(body, palette, materials, kind) {
  const span = kind === "drift" ? 0.83 : kind === "skim" ? 0.72 : 0.62;
  for (const side of [-1, 1]) {
    const wing = createCreatureBone(side < 0 ? "wingL" : "wingR", body, [
      side * 0.22,
      0.43,
      -0.055,
    ]);
    wing.userData.wing = { side, bird: true, foldAngle: 1.2 };
    const feathers = [];
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      feathers.push(
        createBirdFeather(
          0.055 + t * 0.014,
          span * (0.65 + t * 0.35),
          palette.wing,
          palette.tip,
          [side * 0.02, -t * 0.018, -t * 0.012],
          [side * (0.95 - t * 0.12), 0.06 - t * 0.78, -0.1 - t * 0.22],
          0,
        ),
      );
    }
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        feathers.push(
          createBirdFeather(
            0.049,
            span * (row ? 0.3 : 0.48),
            row ? palette.back : palette.cover,
            row ? palette.wing : palette.cover,
            [side * (0.04 + t * 0.1), -t * 0.068, 0.025 + row * 0.027],
            [side * 0.86, -0.08 - t * 0.64, -0.12],
            0,
          ),
        );
      }
    }
    addCreatureBoneMesh(
      wing,
      mergeCreatureGeometries(feathers),
      materials.fluff,
      null,
      null,
      "featherFan",
    );
  }
}
