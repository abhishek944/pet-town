import { createCreatureSphereClusterGeometry } from "../../geometry/create-creature-sphere-cluster-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { buildCreatureJointedLeg } from "../../rig-builders/build-creature-jointed-leg.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
export function buildNimbaaLegs(bob, materials, palette) {
  [
    [0.15, 0.17],
    [-0.15, 0.17],
    [0.15, -0.16],
    [-0.15, -0.16],
  ].forEach(([value8, value9], value10) => {
    let creatureJointedLegResult = buildCreatureJointedLeg(bob, [value8, 0.17, value9], {
      r: 0.056,
      rk: 0.036,
      r2: 0.04,
      len: 0.125,
      phase: value10 === 0 || value10 === 3 ? 0 : 0.5,
      amp: 0.55,
      mat: materials.body,
      bulge: 0.1,
      col: (value11, value12) =>
        lerpCreatureRigColor(
          value11,
          palette.leg,
          palette.hoof,
          smoothstepCreatureValue(0.72, 0.84, value12),
        ),
      pawCol: palette.hoof,
    });
    let creatureSphereClusterGeometryResult4 = createCreatureSphereClusterGeometry(
      [
        {
          p: [0, -0.005, 0],
          r: 0.072,
        },
        {
          p: [0.03, -0.03, 0.02],
          r: 0.045,
        },
        {
          p: [-0.03, -0.03, -0.015],
          r: 0.045,
        },
      ],
      11,
      8,
    );
    colorCreatureGeometryVertices(creatureSphereClusterGeometryResult4, (value13, yValue2) =>
      lerpCreatureRigColor(
        value13,
        palette.woolLo,
        palette.woolMid,
        smoothstepCreatureValue(-0.07, 0.04, yValue2.y),
      ),
    );
    addCreatureBoneMesh(
      creatureJointedLegResult,
      creatureSphereClusterGeometryResult4,
      materials.fluff,
    );
  });
}
