import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
import { orientCreatureGeometry } from "../../rig-builders/orient-creature-geometry.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
export function buildFiddlekitHead(body, palette, materials) {
  let head = createCreatureBone(`head`, body, [0, 0.42, 0.18]);
  let faceSurface = {
    center: [0, 0.12, 0.05],
    radii: [0.19, 0.168, 0.162],
  };
  let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(
    ...faceSurface.radii,
    28,
    20,
  );
  colorCreatureGeometryVertices(
    creatureEllipsoidGeometryResult,
    (lerpValue3, position2, zValue) => {
      let smoothstepCreatureValueResult = smoothstepCreatureValue(
        0.06,
        -0.09,
        position2.y -
          (0.05 * Math.abs(position2.x)) / 0.19 -
          0.05 * smoothstepCreatureValue(0.4, 1, zValue.z),
      );
      lerpCreatureRigColor(lerpValue3, palette.fur, palette.faceLo, smoothstepCreatureValueResult);
      lerpValue3.lerp(
        getCreatureColor(palette.furDark),
        smoothstepCreatureValue(0.65, 0.98, zValue.y) * 0.35,
      );
    },
  );
  transformCreatureGeometry(creatureEllipsoidGeometryResult, faceSurface.center);
  let muzzleSurface = {
    center: [0, 0.068, 0.205],
    radii: [0.06, 0.054, 0.118],
  };
  let creatureEllipsoidGeometryResult2 = createCreatureEllipsoidGeometry(
    ...muzzleSurface.radii,
    20,
    14,
  );
  colorCreatureGeometryVertices(creatureEllipsoidGeometryResult2, (value14, yValue2, zValue2) => {
    lerpCreatureRigColor(
      value14,
      palette.fur,
      palette.faceLo,
      smoothstepCreatureValue(0.075, 0.055, yValue2.y + 0.012 * zValue2.z),
    );
  });
  transformCreatureGeometry(creatureEllipsoidGeometryResult2, muzzleSurface.center);
  let fillCreatureGeometryColorResult = fillCreatureGeometryColor(
    createCreatureEllipsoidGeometry(0.025, 0.019, 0.02, 12, 8),
    3877422,
  );
  transformCreatureGeometry(fillCreatureGeometryColorResult, [0, 0.1, 0.318]);
  let values = [];
  for (let result9 of [-1, 1]) {
    for (let [result10, result11, result12] of [
      [0.02, 0.55, 1],
      [-0.02, 0.85, 0.8],
    ]) {
      let creaturePetalGeometryResult2 = createCreaturePetalGeometry(
        0.045 * result12,
        0.12 * result12,
        0.03,
        {
          tip: 1,
          base: 0.4,
          thinTip: 0.5,
          bend: 0.2,
        },
      );
      colorCreatureGeometryVertices(
        creaturePetalGeometryResult2,
        (value15, value16, value17, value18) =>
          lerpCreatureRigColor(value15, palette.faceLo, palette.ruff ?? 16777215, value18),
      );
      orientCreatureGeometry(
        creaturePetalGeometryResult2,
        [result9 * 1, -0.35 - result11 * 0.3, 0.25],
        [result9 * 0.15, 0.06 + result10, 0.09],
      );
      values.push(creaturePetalGeometryResult2);
    }
  }
  addCreatureBoneMesh(
    head,
    mergeCreatureGeometries([
      creatureEllipsoidGeometryResult,
      creatureEllipsoidGeometryResult2,
      fillCreatureGeometryColorResult,
      ...values,
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
