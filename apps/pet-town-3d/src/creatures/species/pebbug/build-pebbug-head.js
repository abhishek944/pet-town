import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
import { createCreatureTaperedTubeGeometry } from "../../geometry/create-creature-tapered-tube-geometry.js";
import { createCreatureRigVector } from "../../rig-builders/create-creature-rig-vector.js";
export function buildPebbugHead(body, palette, materials) {
  let head = createCreatureBone(`head`, body, [0, 0.15, 0.22]);
  let faceSurface = {
    center: [0, 0.03, 0.08],
    radii: [0.17, 0.145, 0.13],
  };
  let creatureEllipsoidGeometryResult2 = createCreatureEllipsoidGeometry(
    ...faceSurface.radii,
    26,
    18,
  );
  colorCreatureGeometryVertices(
    creatureEllipsoidGeometryResult2,
    (multiplyScalarValue3, yValue3, value22) => {
      lerpCreatureRigColor(
        multiplyScalarValue3,
        palette.faceLo,
        palette.face,
        smoothstepCreatureValue(-0.1, 0.06, yValue3.y),
      );
      multiplyScalarValue3.multiplyScalar(1 - 0.06 * smoothstepCreatureValue(0.1, 0.17, yValue3.y));
    },
  );
  transformCreatureGeometry(creatureEllipsoidGeometryResult2, faceSurface.center);
  let muzzleSurface = {
    center: [0, -0.035, 0.185],
    radii: [0.075, 0.052, 0.045],
  };
  let creatureEllipsoidGeometryResult3 = createCreatureEllipsoidGeometry(
    ...muzzleSurface.radii,
    16,
    10,
  );
  colorCreatureGeometryVertices(creatureEllipsoidGeometryResult3, (value23, yValue4) =>
    lerpCreatureRigColor(
      value23,
      palette.muzzle,
      palette.faceLo,
      smoothstepCreatureValue(0.02, -0.04, yValue4.y) * 0.5,
    ),
  );
  transformCreatureGeometry(creatureEllipsoidGeometryResult3, muzzleSurface.center);
  addCreatureBoneMesh(
    head,
    mergeCreatureGeometries([creatureEllipsoidGeometryResult2, creatureEllipsoidGeometryResult3]),
    materials.body,
    null,
    null,
    `headMesh`,
  );
  for (let result10 of [-1, 1]) {
    let configureCreatureJiggleBoneResult2 = configureCreatureJiggleBone(
      createCreatureBone(
        result10 < 0 ? `antL` : `antR`,
        head,
        [result10 * 0.075, 0.25, 0.3],
        [0.55, 0, -result10 * 0.55],
      ),
      {
        dir: [0, 1, 0],
        len: 0.1,
        k: 90,
        d: 4,
      },
    );
    let fillCreatureGeometryColorResult4 = fillCreatureGeometryColor(
      createCreatureTaperedTubeGeometry(
        [
          createCreatureRigVector(0, 0, 0),
          createCreatureRigVector(0, 0.05, 0.01),
          createCreatureRigVector(result10 * 0.01, 0.09, 0.03),
        ],
        0.01,
        {
          tSeg: 8,
          rSeg: 6,
        },
      ),
      palette.leg,
    );
    let fillCreatureGeometryColorResult5 = fillCreatureGeometryColor(
      createCreatureEllipsoidGeometry(0.024, 0.024, 0.024, 10, 8),
      palette.antBall,
    );
    transformCreatureGeometry(fillCreatureGeometryColorResult5, [result10 * 0.01, 0.1, 0.035]);
    addCreatureBoneMesh(
      configureCreatureJiggleBoneResult2,
      mergeCreatureGeometries([fillCreatureGeometryColorResult4, fillCreatureGeometryColorResult5]),
      materials.body,
    );
  }
  return {
    head,
    faceSurface,
    muzzleSurface,
  };
}
