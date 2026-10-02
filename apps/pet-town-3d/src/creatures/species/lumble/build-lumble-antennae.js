import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { createCreatureBodyGeometry } from "../../geometry/create-creature-body-geometry.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { createCreatureTaperedTubeGeometry } from "../../geometry/create-creature-tapered-tube-geometry.js";
import { createCreatureRigVector } from "../../rig-builders/create-creature-rig-vector.js";
export function buildLumbleAntennae(head, palette, materials) {
  for (let result8 of [-1, 1]) {
    let configureCreatureJiggleBoneResult = configureCreatureJiggleBone(
      createCreatureBone(
        result8 < 0 ? `antL` : `antR`,
        head,
        [result8 * 0.055, 0.62, 0.12],
        [0.1, 0, -result8 * 0.35],
      ),
      {
        dir: [0, 1, 0],
        len: 0.2,
        k: 70,
        d: 4.5,
        limit: 0.6,
      },
    );
    let colorCreatureGeometryVerticesResult = colorCreatureGeometryVertices(
      createCreatureTaperedTubeGeometry(
        [
          createCreatureRigVector(0, 0, 0),
          createCreatureRigVector(result8 * 0.005, 0.07, 0.02),
          createCreatureRigVector(result8 * 0.035, 0.14, 0.02),
          createCreatureRigVector(result8 * 0.075, 0.17, -0.005),
        ],
        (value21) => 0.011 * (1 - 0.35 * value21),
        {
          tSeg: 14,
          rSeg: 6,
        },
      ),
      (value22, value23, value24, value25) =>
        lerpCreatureRigColor(value22, palette.ant, palette.antTip, value25),
    );
    let creatureEllipsoidGeometryResult4 = createCreatureEllipsoidGeometry(
      0.026,
      0.014,
      0.026,
      12,
      6,
    );
    colorCreatureGeometryVertices(creatureEllipsoidGeometryResult4, (copyValue) =>
      copyValue.copy(getCreatureColor(palette.ant)),
    );
    transformCreatureGeometry(creatureEllipsoidGeometryResult4, [result8 * 0.08, 0.172, -0.005]);
    addCreatureBoneMesh(
      configureCreatureJiggleBoneResult,
      mergeCreatureGeometries([
        colorCreatureGeometryVerticesResult,
        creatureEllipsoidGeometryResult4,
      ]),
      materials.bodyLum,
    );
    let creatureBodyGeometryResult2 = createCreatureBodyGeometry(0.024, 0.03, 0.024, {
      taper: -0.2,
      ws: 14,
      hs: 10,
    });
    colorCreatureGeometryVertices(creatureBodyGeometryResult2, (value26, yValue3) =>
      lerpCreatureRigColor(
        value26,
        palette.glowRing,
        palette.glow,
        smoothstepCreatureValue(-0.02, 0.02, yValue3.y),
      ),
    );
    transformCreatureGeometry(creatureBodyGeometryResult2, [result8 * 0.08, 0.14, -0.005]);
    addCreatureBoneMesh(
      configureCreatureJiggleBoneResult,
      creatureBodyGeometryResult2,
      materials.glow,
    );
  }
}
