import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { createCreatureTaperedTubeGeometry } from "../../geometry/create-creature-tapered-tube-geometry.js";
import { createCreatureRigVector } from "../../rig-builders/create-creature-rig-vector.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
export function buildNimbaaHead(body, palette, materials) {
  let head = createCreatureBone(`head`, body, [0, 0.57, 0.4]);
  let faceSurface = {
    center: [0, 0.02, 0.12],
    radii: [0.23, 0.205, 0.215],
  };
  let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(
    ...faceSurface.radii,
    30,
    22,
  );
  colorCreatureGeometryVertices(creatureEllipsoidGeometryResult, (lerpValue2, yValue5, zValue) => {
    lerpCreatureRigColor(
      lerpValue2,
      palette.faceLo,
      palette.face,
      smoothstepCreatureValue(-0.18, 0.1, yValue5.y),
    );
    lerpValue2.lerp(
      getCreatureColor(palette.faceShade),
      smoothstepCreatureValue(-0.1, -0.7, zValue.z) * 0.35,
    );
  });
  transformCreatureGeometry(creatureEllipsoidGeometryResult, faceSurface.center);
  let muzzleSurface = {
    center: [0, -0.07, 0.29],
    radii: [0.09, 0.062, 0.066],
  };
  let creatureEllipsoidGeometryResult2 = createCreatureEllipsoidGeometry(
    ...muzzleSurface.radii,
    20,
    14,
  );
  colorCreatureGeometryVertices(
    creatureEllipsoidGeometryResult2,
    (lerpValue3, yValue6, zValue2) => {
      lerpCreatureRigColor(
        lerpValue3,
        palette.muzzle,
        palette.face,
        smoothstepCreatureValue(0.02, -0.06, yValue6.y) * 0.5,
      );
      lerpValue3.lerp(
        getCreatureColor(palette.faceLo),
        smoothstepCreatureValue(0.3, -0.4, zValue2.z) * 0.5,
      );
    },
  );
  transformCreatureGeometry(creatureEllipsoidGeometryResult2, muzzleSurface.center);
  let fillCreatureGeometryColorResult = fillCreatureGeometryColor(
    createCreatureEllipsoidGeometry(0.024, 0.015, 0.013, 14, 9),
    palette.nose,
  );
  transformCreatureGeometry(fillCreatureGeometryColorResult, [0, -0.038, 0.345], [0.4, 0, 0]);
  let values3 = [];
  for (let result of [-1, 1]) {
    let result2 = 1.15;
    let creatureTaperedTubeGeometryResult2 = createCreatureTaperedTubeGeometry(
      [
        createCreatureRigVector(result * 0.12 * result2, 0.15 * result2, 0.07),
        createCreatureRigVector(result * 0.17 * result2, 0.195 * result2, 0.045),
        createCreatureRigVector(result * 0.21 * result2, 0.205 * result2, -0.005),
        createCreatureRigVector(result * 0.215 * result2, 0.18 * result2, -0.06),
      ],
      (value16) => 0.034 * (1 - 0.7 * value16),
      {
        tSeg: 18,
        rSeg: 10,
      },
    );
    colorCreatureGeometryVertices(
      creatureTaperedTubeGeometryResult2,
      (value17, value18, value19, value20) => {
        lerpCreatureRigColor(value17, palette.horn, palette.hornTip, value20);
      },
    );
    values3.push(creatureTaperedTubeGeometryResult2);
  }
  addCreatureBoneMesh(
    head,
    mergeCreatureGeometries([
      creatureEllipsoidGeometryResult,
      creatureEllipsoidGeometryResult2,
      fillCreatureGeometryColorResult,
      ...values3,
    ]),
    materials.body,
    null,
    null,
    `headMesh`,
  );
  return {
    head,
    faceSurface,
    muzzleSurface,
  };
}
