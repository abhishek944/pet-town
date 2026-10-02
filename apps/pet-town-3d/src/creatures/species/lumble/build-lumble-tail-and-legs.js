import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { createCreatureBodyGeometry } from "../../geometry/create-creature-body-geometry.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { configureCreatureLegBone } from "../../rig-builders/configure-creature-leg-bone.js";
import { createCreatureLimbGeometry } from "../../geometry/create-creature-limb-geometry.js";
export function buildLumbleTailAndLegs(palette, body, materials, bob) {
  let creatureBodyGeometryResult = createCreatureBodyGeometry(0.085, 0.09, 0.13, {
    taper: 0.25,
  });
  colorCreatureGeometryVertices(creatureBodyGeometryResult, (value9, zValue) => {
    let result4 = Math.sin(zValue.z * 55 + 1.2) * 0.5 + 0.5;
    lerpCreatureRigColor(
      value9,
      palette.stripeA,
      palette.stripeB,
      smoothstepCreatureValue(0.2, 0.8, result4),
    );
  });
  addCreatureBoneMesh(
    configureCreatureJiggleBone(createCreatureBone(`tail`, body, [0, 0.25, -0.08]), {
      dir: [0, -0.5, -1],
      len: 0.15,
      k: 90,
      d: 7,
    }),
    transformCreatureGeometry(creatureBodyGeometryResult, [0, -0.04, -0.08], [0.6, 0, 0]),
    materials.fluffLum,
  );
  for (let result5 of [-1, 1]) {
    addCreatureBoneMesh(
      configureCreatureLegBone(
        createCreatureBone(`leg`, bob, [result5 * 0.045, 0.235, 0.075]),
        result5 < 0 ? 0 : 0.5,
        {
          amp: 0.25,
        },
      ),
      colorCreatureGeometryVertices(
        createCreatureLimbGeometry(0.016, 0.04, {
          r2: 0.02,
        }),
        (value10, value11, value12, value13) =>
          lerpCreatureRigColor(value10, palette.fluffLo, palette.fluff, value13),
      ),
      materials.bodyLum,
    );
  }
}
