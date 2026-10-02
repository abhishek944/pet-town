import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
export function buildTuftletJawAndCrest(head, palette, materials) {
  let creatureBoneResult4 = createCreatureBone(`jaw`, head, [0, 0.418, 0.22]);
  let creaturePetalGeometryResult2 = createCreaturePetalGeometry(0.028, 0.055, 0.014, {
    tip: 0.9,
    base: 0.2,
  });
  colorCreatureGeometryVertices(
    creaturePetalGeometryResult2,
    (value18, value19, value20, value21) =>
      lerpCreatureRigColor(value18, palette.beakTip, palette.beak, value21 * 0.5),
  );
  transformCreatureGeometry(
    creaturePetalGeometryResult2,
    [0, -0.008, 0],
    [Math.PI / 2 + 0.12, 0, 0],
  );
  let fillCreatureGeometryColorResult = fillCreatureGeometryColor(
    createCreatureEllipsoidGeometry(0.014, 0.006, 0.02, 8, 6),
    16744341,
  );
  transformCreatureGeometry(fillCreatureGeometryColorResult, [0, 0, 0.018]);
  addCreatureBoneMesh(
    creatureBoneResult4,
    mergeCreatureGeometries([creaturePetalGeometryResult2, fillCreatureGeometryColorResult]),
    materials.body,
  );
  addCreatureBoneMesh(
    configureCreatureJiggleBone(
      createCreatureBone(`crest`, head, [0, 0.565, 0.07 + 0.04], [0.25, 0, 0]),
      {
        dir: [0, 1, 0.2],
        len: 0.12,
        k: 70,
        d: 3.5,
      },
    ),
    mergeCreatureGeometries(
      [
        [-1, 0.6],
        [-0.5, 0.82],
        [0, 1],
        [0.5, 0.82],
        [1, 0.6],
      ].map(([value22, value23]) => {
        let creaturePetalGeometryResult5 = createCreaturePetalGeometry(
          0.028 * value23 + 0.01,
          0.14 * value23,
          0.02,
          {
            tip: 0.5,
            base: 0.5,
            bend: -0.45,
            thinTip: 0.5,
          },
        );
        colorCreatureGeometryVertices(
          creaturePetalGeometryResult5,
          (value24, value25, value26, value27) =>
            lerpCreatureRigColor(
              value24,
              palette.crest,
              palette.crestTip,
              smoothstepCreatureValue(0.25, 1, value27),
            ),
        );
        transformCreatureGeometry(
          creaturePetalGeometryResult5,
          [0, 0, 0],
          [-0.35 + 0.1 * Math.abs(value22), 0, value22],
        );
        return creaturePetalGeometryResult5;
      }),
    ),
    materials.body,
  );
}
