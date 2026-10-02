import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { createCreaturePetalGeometry } from "../../geometry/create-creature-petal-geometry.js";
export function buildTuftletHead(body, palette, materials) {
  let head = createCreatureBone(`head`, body, [0, 0.35, 0.07]);
  let faceSurface = {
    center: [0, 0.09, 0.03],
    radii: [0.155, 0.145, 0.145],
  };
  let creatureEllipsoidGeometryResult2 = createCreatureEllipsoidGeometry(
    ...faceSurface.radii,
    26,
    18,
  );
  colorCreatureGeometryVertices(creatureEllipsoidGeometryResult2, (lerpValue3, value13, zValue) => {
    let result5 =
      smoothstepCreatureValue(0.25, 0.55, zValue.z) * smoothstepCreatureValue(0.55, 0.15, zValue.y);
    lerpCreatureRigColor(lerpValue3, palette.back, palette.belly, result5);
    lerpValue3.lerp(
      getCreatureColor(palette.backDark),
      smoothstepCreatureValue(0.5, 0.95, zValue.y) * 0.25,
    );
  });
  transformCreatureGeometry(creatureEllipsoidGeometryResult2, faceSurface.center);
  let creaturePetalGeometryResult = createCreaturePetalGeometry(0.034, 0.072, 0.02, {
    tip: 0.9,
    base: 0.2,
  });
  colorCreatureGeometryVertices(creaturePetalGeometryResult, (value14, value15, value16, value17) =>
    lerpCreatureRigColor(value14, palette.beak, palette.beakTip, value17),
  );
  transformCreatureGeometry(
    creaturePetalGeometryResult,
    [0, 0.072, 0.158],
    [Math.PI / 2 - 0.2, 0, 0],
  );
  addCreatureBoneMesh(
    head,
    mergeCreatureGeometries([creatureEllipsoidGeometryResult2, creaturePetalGeometryResult]),
    materials.body,
    null,
    null,
    `headMesh`,
  );
  return {
    head,
    faceSurface,
  };
}
