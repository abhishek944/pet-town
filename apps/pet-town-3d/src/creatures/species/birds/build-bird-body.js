import { createCreatureBodyGeometry } from "../../geometry/create-creature-body-geometry.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { createBirdFeather } from "./create-bird-feather.js";

export function buildBirdBody(body, palette, materials, kind) {
  const torso = createCreatureBodyGeometry(0.3, 0.28, 0.27, { taper: 0.25, sag: 0.18 });
  colorCreatureGeometryVertices(torso, (color, position, normal) => {
    const breast = Math.max(0, normal.z) * 0.95;
    color.copy(getCreatureColor(palette.back)).lerp(getCreatureColor(palette.belly), breast);
    if (kind === "skim")
      color.lerp(
        getCreatureColor(palette.throat),
        breast * Math.max(0, Math.min(1, (position.y + 0.03) * 9)),
      );
  });
  const pieces = [torso];
  // Scalloped breast rows follow the round surface rather than floating as flat cards.
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.078 + (row % 2) * 0.013;
      const y = 0.085 - row * 0.07;
      const z = 0.265 * Math.sqrt(Math.max(0.1, 1 - (x / 0.3) ** 2 - (y / 0.26) ** 2));
      pieces.push(
        createBirdFeather(
          0.05,
          0.125,
          kind === "skim" && row === 0 ? palette.throat : palette.belly,
          kind === "hush" && i % 2 === row % 2 ? palette.cover : palette.belly,
          [x, y, z],
          [x * 0.6, -1, -0.28],
          0,
        ),
      );
    }
  }
  for (const side of [-1, 1]) {
    for (let toe = 0; toe < 3; toe++) {
      pieces.push(
        transformCreatureGeometry(
          fillCreatureGeometryColor(
            createCreatureEllipsoidGeometry(0.018, 0.032, 0.036, 10, 8),
            palette.foot,
          ),
          [side * 0.085 + (toe - 1) * 0.027, -0.272, 0.072 - Math.abs(toe - 1) * 0.009],
          [0.25, 0, 0],
        ),
      );
    }
  }
  addCreatureBoneMesh(
    body,
    mergeCreatureGeometries(pieces),
    materials.fluff,
    null,
    null,
    "birdBody",
  );
  const tail = createCreatureBone("tail", body, [0, 0.26, -0.19]);
  const tailFeathers = [];
  for (let i = -2; i <= 2; i++) {
    const fork = kind === "skim";
    tailFeathers.push(
      createBirdFeather(
        fork ? 0.044 : 0.054,
        fork ? 0.17 + Math.abs(i) * 0.1 : 0.23 - Math.abs(i) * 0.015,
        palette.back,
        palette.tip,
        [i * 0.022, 0, 0],
        [i * 0.22, 0.11, -1],
        0,
      ),
    );
  }
  addCreatureBoneMesh(tail, mergeCreatureGeometries(tailFeathers), materials.fluff);
}
