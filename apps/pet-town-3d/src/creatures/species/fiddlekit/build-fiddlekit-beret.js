import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
import { createCreatureRigVector } from "../../rig-builders/create-creature-rig-vector.js";
import { createCreatureTaperedTubeGeometry } from "../../geometry/create-creature-tapered-tube-geometry.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
export function buildFiddlekitBeret(head, palette, materials) {
  let creatureBoneResult4 = createCreatureBone(`beret`, head, [0, 0.705, 0.24], [-0.25, 0, 0.18]);
  configureCreatureJiggleBone(creatureBoneResult4, {
    dir: [0, 1, 0],
    len: 0.06,
    k: 180,
    d: 10,
    limit: 0.3,
  });
  {
    let creatureEllipsoidGeometryResult3 = createCreatureEllipsoidGeometry(
      0.07,
      0.04,
      0.066,
      18,
      10,
    );
    colorCreatureGeometryVertices(
      creatureEllipsoidGeometryResult3,
      (multiplyScalarValue, position3) => {
        lerpCreatureRigColor(
          multiplyScalarValue,
          palette.capLo,
          palette.cap,
          smoothstepCreatureValue(-0.03, 0.03, position3.y),
        );
        multiplyScalarValue.multiplyScalar(
          0.84 +
            0.22 *
              smoothstepCreatureValue(
                -0.3,
                0.6,
                Math.sin(position3.x * 170 + position3.y * 110) *
                  Math.sin(position3.z * 170 - position3.y * 110),
              ),
        );
      },
    );
    addCreatureBoneMesh(
      creatureBoneResult4,
      mergeCreatureGeometries([
        creatureEllipsoidGeometryResult3,
        fillCreatureGeometryColor(
          createCreatureTaperedTubeGeometry(
            [
              createCreatureRigVector(0, 0.035, 0),
              createCreatureRigVector(0.006, 0.06, 0.004),
              createCreatureRigVector(0.02, 0.074, 0),
            ],
            0.009,
            {
              tSeg: 6,
              rSeg: 5,
            },
          ),
          palette.capLo,
        ),
      ]),
      materials.body,
    );
  }
}
