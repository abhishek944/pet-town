import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { configureCreatureLegBone } from "../../rig-builders/configure-creature-leg-bone.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { createCreatureTaperedTubeGeometry } from "../../geometry/create-creature-tapered-tube-geometry.js";
import { createCreatureRigVector } from "../../rig-builders/create-creature-rig-vector.js";
export function buildPondleLimbs(bob, palette, materials) {
  for (let result2 of [-1, 1]) {
    let configureCreatureLegBoneResult = configureCreatureLegBone(
      createCreatureBone(result2 < 0 ? `hindL` : `hindR`, bob, [result2 * 0.17, 0.14, -0.08]),
      0,
      {
        hind: true,
        amp: 0.5,
      },
    );
    let creatureEllipsoidGeometryResult2 = createCreatureEllipsoidGeometry(
      0.088,
      0.078,
      0.13,
      18,
      12,
    );
    colorCreatureGeometryVertices(creatureEllipsoidGeometryResult2, (value, value2, yValue) =>
      lerpCreatureRigColor(
        value,
        palette.belly,
        palette.skin,
        smoothstepCreatureValue(-0.5, 0.2, yValue.y),
      ),
    );
    transformCreatureGeometry(
      creatureEllipsoidGeometryResult2,
      [result2 * 0.03, -0.03, 0.02],
      [0.3, 0, result2 * 0.2],
    );
    let creatureEllipsoidGeometryResult3 = createCreatureEllipsoidGeometry(
      0.066,
      0.025,
      0.09,
      16,
      10,
    );
    fillCreatureGeometryColor(creatureEllipsoidGeometryResult3, palette.skinDark);
    transformCreatureGeometry(creatureEllipsoidGeometryResult3, [result2 * 0.045, -0.12, 0.09]);
    addCreatureBoneMesh(
      configureCreatureLegBoneResult,
      mergeCreatureGeometries([
        creatureEllipsoidGeometryResult2,
        creatureEllipsoidGeometryResult3,
        ...[-1, 0, 1].map((value3) => {
          let fillCreatureGeometryColorResult = fillCreatureGeometryColor(
            createCreatureEllipsoidGeometry(0.022, 0.018, 0.022, 10, 8),
            palette.skinDark,
          );
          transformCreatureGeometry(fillCreatureGeometryColorResult, [
            result2 * 0.045 + value3 * 0.04,
            -0.12,
            0.17 - Math.abs(value3) * 0.02,
          ]);
          return fillCreatureGeometryColorResult;
        }),
      ]),
      materials.glossy,
    );
  }
  for (let result3 of [-1, 1]) {
    let configureCreatureLegBoneResult2 = configureCreatureLegBone(
      createCreatureBone(result3 < 0 ? `armL` : `armR`, bob, [result3 * 0.14, 0.15, 0.14]),
      result3 < 0 ? 0 : 0.5,
      {
        amp: 0.4,
      },
    );
    let colorCreatureGeometryVerticesResult = colorCreatureGeometryVertices(
      createCreatureTaperedTubeGeometry(
        [
          createCreatureRigVector(0, 0, 0),
          createCreatureRigVector(result3 * 0.008, -0.055, -0.012),
          createCreatureRigVector(result3 * 0.012, -0.1, 0.012),
          createCreatureRigVector(result3 * 0.012, -0.125, 0.045),
        ],
        (value4) => 0.034 - value4 * 0.008,
        {
          tSeg: 12,
          rSeg: 8,
        },
      ),
      (value5, value6, value7, value8) =>
        lerpCreatureRigColor(value5, palette.skin, palette.skinDark, value8),
    );
    let fillCreatureGeometryColorResult2 = fillCreatureGeometryColor(
      createCreatureEllipsoidGeometry(0.04, 0.02, 0.042, 12, 8),
      palette.skinDark,
    );
    transformCreatureGeometry(fillCreatureGeometryColorResult2, [result3 * 0.012, -0.135, 0.06]);
    addCreatureBoneMesh(
      configureCreatureLegBoneResult2,
      mergeCreatureGeometries([
        colorCreatureGeometryVerticesResult,
        fillCreatureGeometryColorResult2,
      ]),
      materials.glossy,
    );
  }
}
