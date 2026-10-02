import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { createCreatureSphereClusterGeometry } from "../../geometry/create-creature-sphere-cluster-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
import { createCreatureBodyGeometry } from "../../geometry/create-creature-body-geometry.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { createCreatureTaperedTubeGeometry } from "../../geometry/create-creature-tapered-tube-geometry.js";
import { createCreatureRigVector } from "../../rig-builders/create-creature-rig-vector.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
export function buildNimbaaCloudTail(body, palette, materials) {
  let configureCreatureJiggleBoneResult = configureCreatureJiggleBone(
    createCreatureBone(`tail`, body, [0, 0.47, -0.36]),
    {
      dir: [0, 0.3, -1],
      len: 0.12,
      k: 90,
      d: 5,
    },
  );
  let creatureSphereClusterGeometryResult2 = createCreatureSphereClusterGeometry(
    [
      {
        p: [0, 0, -0.05],
        r: 0.066,
      },
      {
        p: [0.055, -0.01, -0.07],
        r: 0.05,
      },
      {
        p: [-0.055, -0.005, -0.075],
        r: 0.05,
      },
      {
        p: [0.01, 0.05, -0.06],
        r: 0.05,
      },
    ],
    11,
    8,
  );
  colorCreatureGeometryVertices(creatureSphereClusterGeometryResult2, (value14, yValue3) =>
    lerpCreatureRigColor(
      value14,
      palette.cloudLo,
      palette.cloud,
      smoothstepCreatureValue(-0.05, 0.06, yValue3.y),
    ),
  );
  addCreatureBoneMesh(
    configureCreatureJiggleBoneResult,
    creatureSphereClusterGeometryResult2,
    materials.fluff,
  );
  let creatureBoneResult3 = createCreatureBone(`drop`, configureCreatureJiggleBoneResult, [
    0,
    0.47 - 0.07,
    -0.44,
  ]);
  configureCreatureJiggleBone(creatureBoneResult3, {
    dir: [0, -1, 0],
    len: 0.06,
    k: 40,
    d: 2.5,
    grav: 1.5,
  });
  let creatureBodyGeometryResult = createCreatureBodyGeometry(0.018, 0.026, 0.018, {
    taper: 0.55,
    ws: 12,
    hs: 10,
  });
  creatureBodyGeometryResult.rotateX(Math.PI);
  transformCreatureGeometry(creatureBodyGeometryResult, [0, -0.05, 0]);
  let creatureTaperedTubeGeometryResult = createCreatureTaperedTubeGeometry(
    [
      createCreatureRigVector(0, 0, 0),
      createCreatureRigVector(0, -0.015, 0.001),
      createCreatureRigVector(0, -0.03, 0),
    ],
    0.004,
    {
      tSeg: 4,
      rSeg: 4,
    },
  );
  colorCreatureGeometryVertices(creatureBodyGeometryResult, (value15, yValue4) =>
    lerpCreatureRigColor(
      value15,
      palette.drop,
      16777215,
      smoothstepCreatureValue(-0.06, -0.035, yValue4.y) * 0.6,
    ),
  );
  fillCreatureGeometryColor(creatureTaperedTubeGeometryResult, palette.cloudLo);
  addCreatureBoneMesh(
    creatureBoneResult3,
    mergeCreatureGeometries([creatureBodyGeometryResult, creatureTaperedTubeGeometryResult]),
    materials.glossy,
  );
}
