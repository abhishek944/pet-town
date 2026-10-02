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
import { creaturesState } from "../../state.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
import { buildCreatureJointedLeg } from "../../rig-builders/build-creature-jointed-leg.js";
export function buildPebbugFlowerAndLegs(body, palette, materials, bob) {
  let configureCreatureJiggleBoneResult = configureCreatureJiggleBone(
    createCreatureBone(`flower`, body, [-0.07, 0.4, 0], [0.15, 0, 0.25]),
    {
      dir: [0, 1, 0],
      len: 0.1,
      k: 60,
      d: 3,
    },
  );
  let fillCreatureGeometryColorResult = fillCreatureGeometryColor(
    createCreatureTaperedTubeGeometry(
      [
        createCreatureRigVector(0, -0.02, 0),
        createCreatureRigVector(0.005, 0.04, 0),
        createCreatureRigVector(0, 0.08, 0.01),
      ],
      0.008,
      {
        tSeg: 8,
        rSeg: 5,
      },
    ),
    5941322,
  );
  let values2 = [];
  for (let index2 = 0; index2 < 5; index2++) {
    let result6 = (index2 / 5) * creaturesState.creatureRigTau;
    let creatureEllipsoidGeometryResult4 = createCreatureEllipsoidGeometry(
      0.026,
      0.008,
      0.036,
      10,
      6,
    );
    colorCreatureGeometryVertices(creatureEllipsoidGeometryResult4, (value17, position3) =>
      lerpCreatureRigColor(
        value17,
        16777215,
        palette.petal ?? 16751304,
        smoothstepCreatureValue(0.01, 0.035, Math.hypot(position3.x, position3.z)),
      ),
    );
    transformCreatureGeometry(
      creatureEllipsoidGeometryResult4,
      [Math.sin(result6) * 0.03, 0.085, 0.01 + Math.cos(result6) * 0.03],
      [0.25, result6, 0],
    );
    values2.push(creatureEllipsoidGeometryResult4);
  }
  let fillCreatureGeometryColorResult2 = fillCreatureGeometryColor(
    createCreatureEllipsoidGeometry(0.017, 0.013, 0.017, 8, 6),
    16767050,
  );
  transformCreatureGeometry(fillCreatureGeometryColorResult2, [0, 0.092, 0.01]);
  let fillCreatureGeometryColorResult3 = fillCreatureGeometryColor(
    createCreaturePetalGeometry(0.018, 0.04, 0.005, {
      tip: 0.8,
      base: 0.4,
    }),
    7323477,
  );
  transformCreatureGeometry(fillCreatureGeometryColorResult3, [0.004, 0.02, 0], [0, 0, -1]);
  addCreatureBoneMesh(
    configureCreatureJiggleBoneResult,
    mergeCreatureGeometries([
      fillCreatureGeometryColorResult,
      ...values2,
      fillCreatureGeometryColorResult2,
      fillCreatureGeometryColorResult3,
    ]),
    materials.body,
  );
  [0.14, 0, -0.14].forEach((value18, value19) => {
    for (let result7 of [-1, 1]) {
      let result8 = result7 * 1.95;
      let result9 = -result8 + result7 * 0.2;
      buildCreatureJointedLeg(bob, [result7 * 0.2, 0.1, value18], {
        r: 0.036,
        rk: 0.026,
        r2: 0.021,
        len: 0.19,
        knee: 0.45,
        phase: (value19 % 2 == 0) == result7 > 0 ? 0 : 0.5,
        amp: 0.5,
        mat: materials.body,
        rot: [0, 0, result8],
        kneeRot: [0, 0, result9],
        bulge: 0.15,
        kneeBulge: 1.3,
        pawShape: `tip`,
        col: (value20, value21) =>
          lerpCreatureRigColor(
            value20,
            palette.leg,
            palette.legTip,
            smoothstepCreatureValue(0.35, 1, value21),
          ),
        pawCol: palette.legTip,
      });
    }
  });
}
