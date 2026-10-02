import { createCreatureDeformedSphereGeometry } from "../../geometry/create-creature-deformed-sphere-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { creaturesState } from "../../state.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
import { orientCreatureGeometry } from "../../rig-builders/orient-creature-geometry.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
export function buildLumbleFluff(palette, body, materials) {
  let values = [0.13, 0.135, 0.125];
  let creatureDeformedSphereGeometryResult = createCreatureDeformedSphereGeometry(
    (setValue, value, value2, value3) => {
      let result = 1 + 0.035 * Math.sin(value * 9 + value2 * 7) * Math.sin(value3 * 8 - value2 * 5);
      setValue.set(
        value * values[0] * result,
        value2 * values[1] * result,
        value3 * values[2] * result,
      );
    },
    26,
    18,
  );
  colorCreatureGeometryVertices(creatureDeformedSphereGeometryResult, (value4, yValue) => {
    lerpCreatureRigColor(
      value4,
      palette.fluffLo,
      palette.fluff,
      smoothstepCreatureValue(-0.12, 0.06, yValue.y),
    );
  });
  let values2 = [];
  for (let index = 0; index < 2; index++) {
    let result2 = index ? 9 : 12;
    for (let index2 = 0; index2 < result2; index2++) {
      let result3 = (index2 / result2) * creaturesState.creatureRigTau + index * 0.3;
      let creaturePetalGeometryResult = createCreaturePetalGeometry(
        0.05 - index * 0.008,
        0.1 - index * 0.02,
        0.03,
        {
          tip: 0.9,
          base: 0.35,
          thinTip: 0.6,
          bend: 0.25,
          ws: 10,
          hs: 9,
        },
      );
      colorCreatureGeometryVertices(creaturePetalGeometryResult, (value5, value6, value7, value8) =>
        lerpCreatureRigColor(
          value5,
          palette.ruff,
          palette.fluffLo,
          smoothstepCreatureValue(0.3, 1, value8) * 0.35,
        ),
      );
      orientCreatureGeometry(
        creaturePetalGeometryResult,
        [Math.sin(result3), index ? -0.9 : -0.35, Math.cos(result3)],
        [Math.sin(result3) * 0.08, 0.075 - index * 0.05, Math.cos(result3) * 0.075 + 0.015],
        0,
      );
      values2.push(creaturePetalGeometryResult);
    }
  }
  addCreatureBoneMesh(
    body,
    mergeCreatureGeometries([
      creatureDeformedSphereGeometryResult,
      mergeCreatureGeometries(values2),
    ]),
    materials.fluffLum,
    null,
    null,
    `bodyMesh`,
  );
}
