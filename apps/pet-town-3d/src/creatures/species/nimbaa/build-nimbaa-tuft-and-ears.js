import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { createCreatureSphereClusterGeometry } from "../../geometry/create-creature-sphere-cluster-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { configureCreatureJiggleBone } from "../../rig-builders/configure-creature-jiggle-bone.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
export function buildNimbaaTuftAndEars(palette, head, materials) {
  let creatureSphereClusterGeometryResult3 = createCreatureSphereClusterGeometry(
    [
      {
        p: [0, 0.225, 0.1],
        r: 0.07,
      },
      {
        p: [-0.07, 0.205, 0.11],
        r: 0.055,
      },
      {
        p: [0.07, 0.205, 0.11],
        r: 0.055,
      },
      {
        p: [0, 0.2, 0.19],
        r: 0.05,
      },
      {
        p: [-0.035, 0.245, 0.03],
        r: 0.05,
      },
      {
        p: [0.045, 0.24, 0.04],
        r: 0.046,
      },
    ],
    11,
    8,
  );
  colorCreatureGeometryVertices(creatureSphereClusterGeometryResult3, (value21, yValue7) =>
    lerpCreatureRigColor(
      value21,
      palette.woolMid,
      palette.woolHi,
      smoothstepCreatureValue(0.16, 0.26, yValue7.y),
    ),
  );
  addCreatureBoneMesh(
    configureCreatureJiggleBone(createCreatureBone(`tuft`, head, [0, 0.75, 0.5]), {
      dir: [0, 1, 0],
      len: 0.08,
      k: 160,
      d: 9,
    }),
    creatureSphereClusterGeometryResult3,
    materials.fluff,
  ).position.set(0, -0.18, -0.1);
  for (let result3 of [-1, 1]) {
    let configureCreatureJiggleBoneResult2 = configureCreatureJiggleBone(
      createCreatureBone(
        result3 < 0 ? `earL` : `earR`,
        head,
        [result3 * 0.2, 0.57, 0.53],
        [0.15, result3 * 0.35, -result3 * (Math.PI / 2 + 0.5)],
      ),
      {
        dir: [0, 1, 0],
        len: 0.17,
        k: 70,
        d: 5,
        grav: 2.2,
      },
    );
    let creaturePetalGeometryResult = createCreaturePetalGeometry(0.064, 0.19, 0.026, {
      tip: 0.85,
      base: 0.55,
      cup: 0.35,
    });
    colorCreatureGeometryVertices(creaturePetalGeometryResult, (lerpValue4, position3, zValue3) => {
      lerpCreatureRigColor(
        lerpValue4,
        palette.face,
        palette.faceLo,
        smoothstepCreatureValue(0, 0.18, position3.y) * 0.4,
      );
      let result4 =
        smoothstepCreatureValue(0.1, 0.6, zValue3.z) *
        (1 - smoothstepCreatureValue(0.022, 0.055, Math.abs(position3.x)));
      lerpValue4.lerp(getCreatureColor(16758984), result4 * 0.85);
    });
    addCreatureBoneMesh(
      configureCreatureJiggleBoneResult2,
      creaturePetalGeometryResult,
      materials.body,
    );
  }
}
