import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { creaturesState } from "../../state.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { clampCreatureValue } from "../../math/clamp-creature-value.js";
import { lerpCreatureRigColorRamp } from "../../rig-builders/lerp-creature-rig-color-ramp.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
export function buildLumbleWings(body, palette, materials) {
  for (let result6 of [-1, 1]) {
    let creatureBoneResult4 = createCreatureBone(result6 < 0 ? `wingL` : `wingR`, body, [
      result6 * 0.1,
      0.42,
      -0.02,
    ]);
    creatureBoneResult4.userData.wing = {
      side: result6,
    };
    let values3 = [0.18, -result6 * 0.12, -result6 * 1.25];
    let creaturePetalGeometryResult2 = createCreaturePetalGeometry(0.2, 0.36, 0.012, {
      tip: 0.4,
      base: 0.9,
      cup: -0.05,
      thinTip: 0.15,
      ws: 24,
      hs: 28,
    });
    {
      let position2 = creaturePetalGeometryResult2.attributes.position;
      for (let index3 = 0; index3 < position2.count; index3++) {
        let result7 = position2.getY(index3) / 0.36;
        position2.setX(
          index3,
          position2.getX(index3) *
            (1 -
              0.13 *
                smoothstepCreatureValue(0.35, 0.8, result7) *
                (0.5 - 0.5 * Math.cos(result7 * creaturesState.creatureRigTau * 4.5))),
        );
      }
      creaturePetalGeometryResult2.computeVertexNormals();
    }
    colorCreatureGeometryVertices(
      creaturePetalGeometryResult2,
      (lerpValue, position3, value14, value15) => {
        let clampCreatureValueResult = clampCreatureValue(
          Math.max(value15, Math.abs(position3.x) / 0.2),
          0,
          1,
        );
        lerpCreatureRigColorRamp(
          lerpValue,
          palette.wingIn,
          palette.wingMid,
          palette.wingOut,
          smoothstepCreatureValue(0.12, 0.92, clampCreatureValueResult * 0.7 + value15 * 0.3),
        );
        lerpValue.lerp(
          getCreatureColor(16777215),
          smoothstepCreatureValue(0.9, 0.99, value15 + Math.abs(position3.x) * 0.4) * 0.5,
        );
        lerpValue.lerp(
          getCreatureColor(palette.wingVein),
          (1 -
            smoothstepCreatureValue(
              0,
              0.01,
              Math.abs(Math.sin(Math.atan2(position3.x, position3.y) * 5)) * 0.03,
            )) *
            0.25 *
            smoothstepCreatureValue(0.2, 0.5, value15),
        );
      },
    );
    transformCreatureGeometry(creaturePetalGeometryResult2, [0, 0, 0], values3);
    let creaturePetalGeometryResult3 = createCreaturePetalGeometry(0.12, 0.22, 0.01, {
      tip: 0.45,
      base: 0.7,
      thinTip: 0.15,
    });
    colorCreatureGeometryVertices(
      creaturePetalGeometryResult3,
      (lerpValue2, value16, value17, value18) => {
        lerpCreatureRigColor(
          lerpValue2,
          palette.wingIn,
          palette.wingOut2,
          smoothstepCreatureValue(0.2, 0.95, value18),
        );
        lerpValue2.lerp(
          getCreatureColor(16777215),
          smoothstepCreatureValue(0.92, 1, value18) * 0.5,
        );
      },
    );
    transformCreatureGeometry(
      creaturePetalGeometryResult3,
      [0, -0.04, -0.02],
      [-0.3, -result6 * 0.3, -result6 * 2.25],
    );
    addCreatureBoneMesh(
      creatureBoneResult4,
      mergeCreatureGeometries([creaturePetalGeometryResult2, creaturePetalGeometryResult3]),
      materials.bodyLum,
    );
    let creatureEllipsoidGeometryResult2 = createCreatureEllipsoidGeometry(
      0.05,
      0.05,
      0.016,
      16,
      10,
    );
    colorCreatureGeometryVertices(creatureEllipsoidGeometryResult2, (value19, position4) =>
      lerpCreatureRigColor(
        value19,
        palette.glowRing,
        palette.glow,
        smoothstepCreatureValue(0.05, 0.02, Math.hypot(position4.x, position4.y)),
      ),
    );
    let creatureEllipsoidGeometryResult3 = createCreatureEllipsoidGeometry(
      0.024,
      0.024,
      0.014,
      10,
      8,
    );
    fillCreatureGeometryColor(creatureEllipsoidGeometryResult3, palette.glowRing);
    transformCreatureGeometry(creatureEllipsoidGeometryResult3, [0.05, 0.1, 0]);
    let mergeCreatureGeometriesResult = mergeCreatureGeometries([
      creatureEllipsoidGeometryResult2,
      creatureEllipsoidGeometryResult3,
    ]);
    transformCreatureGeometry(mergeCreatureGeometriesResult, [0.015, 0.2, 0]);
    transformCreatureGeometry(mergeCreatureGeometriesResult, [0, 0, 0], values3);
    addCreatureBoneMesh(creatureBoneResult4, mergeCreatureGeometriesResult, materials.glow);
  }
}
