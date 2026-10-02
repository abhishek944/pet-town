import { createCreatureBodyGeometry } from "../../geometry/create-creature-body-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { buildCreatureJointedLeg } from "../../rig-builders/build-creature-jointed-leg.js";
export function buildFiddlekitBodyAndLegs(palette, body, materials, bob) {
  let creatureBodyGeometryResult = createCreatureBodyGeometry(0.175, 0.16, 0.235, {
    taper: 0.08,
  });
  colorCreatureGeometryVertices(creatureBodyGeometryResult, (lerpValue, value, yValue) => {
    lerpCreatureRigColor(
      lerpValue,
      palette.belly,
      palette.fur,
      smoothstepCreatureValue(-0.4, 0.25, yValue.y),
    );
    lerpValue.lerp(
      getCreatureColor(palette.furDark),
      smoothstepCreatureValue(0.72, 0.98, yValue.y) * 0.55,
    );
  });
  addCreatureBoneMesh(body, creatureBodyGeometryResult, materials.body, null, null, `bodyMesh`);
  [
    [0.095, 0.13],
    [-0.095, 0.13],
    [0.095, -0.13],
    [-0.095, -0.13],
  ].forEach(([value2, value3], value4) => {
    buildCreatureJointedLeg(bob, [value2, 0.21, value3], {
      r: 0.056,
      rk: 0.032,
      r2: 0.03,
      len: 0.165,
      phase: value4 === 0 || value4 === 3 ? 0 : 0.5,
      amp: 0.7,
      mat: materials.body,
      bulge: 0.12,
      kneeBulge: 1.06,
      col: (value5, value6) =>
        lerpCreatureRigColor(
          value5,
          palette.fur,
          palette.sock,
          smoothstepCreatureValue(0.4, 0.62, value6),
        ),
      pawCol: palette.toe ?? palette.sock,
    });
  });
}
