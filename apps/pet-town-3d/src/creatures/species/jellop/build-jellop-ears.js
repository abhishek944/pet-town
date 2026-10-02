import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
export function buildJellopEars(body, palette, materials) {
  for (let result10 of [-1, 1]) {
    let configureCreatureJiggleBoneResult = configureCreatureJiggleBone(
      createCreatureBone(
        result10 < 0 ? `earL` : `earR`,
        body,
        [result10 * 0.15, 0.35, -0.02],
        [0, 0, -result10 * 0.35],
      ),
      {
        dir: [0, 1, 0],
        len: 0.08,
        k: 70,
        d: 3,
      },
    );
    let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(
      0.058,
      0.06,
      0.052,
      16,
      12,
    );
    transformCreatureGeometry(creatureEllipsoidGeometryResult, [0, 0.025, 0]);
    colorCreatureGeometryVertices(creatureEllipsoidGeometryResult, (value3, yValue4) =>
      lerpCreatureRigColor(
        value3,
        palette.lo,
        palette.hi,
        0.55 + smoothstepCreatureValue(-0.03, 0.06, yValue4.y) * 0.45,
      ),
    );
    let addCreatureBoneMeshResult3 = addCreatureBoneMesh(
      configureCreatureJiggleBoneResult,
      creatureEllipsoidGeometryResult,
      materials.jelly,
    );
    addCreatureBoneMeshResult3.renderOrder = 3;
  }
}
