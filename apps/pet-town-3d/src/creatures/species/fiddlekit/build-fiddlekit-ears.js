import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
import { orientCreatureGeometry } from "../../rig-builders/orient-creature-geometry.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
export function buildFiddlekitEars(head, palette, materials) {
  for (let result13 of [-1, 1]) {
    let configureCreatureJiggleBoneResult2 = configureCreatureJiggleBone(
      createCreatureBone(
        result13 < 0 ? `earL` : `earR`,
        head,
        [result13 * 0.105, 0.65, 0.18 + 0.02],
        [-0.1, result13 * 0.2, -result13 * 0.42],
      ),
      {
        dir: [0, 1, 0],
        len: 0.2,
        k: 150,
        d: 8,
      },
    );
    let creaturePetalGeometryResult3 = createCreaturePetalGeometry(0.08, 0.21, 0.032, {
      tip: 1.1,
      base: 0.4,
      cup: 0.35,
      thinTip: 0.6,
    });
    colorCreatureGeometryVertices(
      creaturePetalGeometryResult3,
      (lerpValue4, xValue, zValue3, value19) => {
        lerpCreatureRigColor(
          lerpValue4,
          palette.fur,
          palette.furDark,
          smoothstepCreatureValue(0.6, 0.92, value19),
        );
        let result14 =
          smoothstepCreatureValue(0.1, 0.6, zValue3.z) *
          (1 - smoothstepCreatureValue(0.035, 0.065, Math.abs(xValue.x))) *
          smoothstepCreatureValue(0.9, 0.5, value19);
        lerpValue4.lerp(getCreatureColor(palette.earInner), result14);
      },
    );
    let values4 = [];
    for (let [result15, result16] of [
      [0.05, 1],
      [0.085, 0.8],
      [0.03, 0.8],
    ]) {
      let creaturePetalGeometryResult4 = createCreaturePetalGeometry(
        0.022 * result16,
        0.08 * result16,
        0.012,
        {
          tip: 0.9,
          base: 0.4,
          ws: 8,
          hs: 7,
        },
      );
      fillCreatureGeometryColor(creaturePetalGeometryResult4, palette.ruff ?? 16777215);
      orientCreatureGeometry(
        creaturePetalGeometryResult4,
        [(result15 - 0.05) * 3, 1, 0.5],
        [0, result15, 0.022],
      );
      values4.push(creaturePetalGeometryResult4);
    }
    addCreatureBoneMesh(
      configureCreatureJiggleBoneResult2,
      mergeCreatureGeometries([creaturePetalGeometryResult3, ...values4]),
      materials.body,
    );
  }
}
