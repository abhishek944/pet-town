import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
export function buildJellopLeafWrap(body, result2, result, result3, palette, materials) {
  let wrap = createCreatureBone(`wrap`, body, [0, 0.15, 0]);
  {
    let creaturePetalGeometryResult = createCreaturePetalGeometry(0.2, 0.62, 0.012, {
      tip: 0.6,
      base: 0.5,
      thinTip: 0.2,
      ws: 24,
      hs: 20,
    });
    let position3 = creaturePetalGeometryResult.attributes.position;
    for (let index = 0; index < position3.count; index++) {
      let xResult = position3.getX(index);
      let yResult = position3.getY(index);
      let zResult = position3.getZ(index);
      let result5 = yResult / 0.62;
      let result6 = -Math.PI * 0.4 - result5 * Math.PI * 1.25;
      let result7 = -0.15 + 0.29 * result5 + xResult * 0.5;
      let smoothstepCreatureValueResult = smoothstepCreatureValue(0.8, 1, result5);
      let result8 =
        Math.sqrt(Math.max(0.05, 1 - (Math.min(result7, result2 * 0.95) / result2) ** 2)) * 1.02 +
        0.014 +
        zResult +
        smoothstepCreatureValueResult * 0.07;
      position3.setXYZ(
        index,
        Math.sin(result6) * result * result8,
        result7 + smoothstepCreatureValueResult * 0.035,
        Math.cos(result6) * result3 * result8,
      );
    }
    creaturePetalGeometryResult.computeVertexNormals();
    colorCreatureGeometryVertices(
      creaturePetalGeometryResult,
      (lerpValue3, position4, value, value2) => {
        lerpCreatureRigColor(
          lerpValue3,
          palette.leaf,
          palette.leafLight,
          smoothstepCreatureValue(-0.12, 0.05, position4.y),
        );
        let atan2Result = Math.atan2(position4.x, -position4.z);
        let result9 =
          1 -
          smoothstepCreatureValue(
            0,
            0.012,
            Math.abs(position4.y + 0.1 - 0.02 * Math.sin(atan2Result * 3)),
          );
        lerpValue3.lerp(getCreatureColor(palette.leafVein), result9 * 0.6);
        lerpValue3.lerp(
          getCreatureColor(palette.leafVein),
          (1 - smoothstepCreatureValue(0, 0.1, Math.abs(Math.sin(atan2Result * 9)))) * 0.25,
        );
      },
    );
    addCreatureBoneMesh(wrap, creaturePetalGeometryResult, materials.body);
  }
}
