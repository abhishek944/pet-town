import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { createCreatureSphereClusterGeometry } from "../../geometry/create-creature-sphere-cluster-geometry.js";
export function buildLumbleHead(body, palette, materials) {
  let head = createCreatureBone(`head`, body, [0, 0.42, 0.06]);
  let faceSurface = {
    center: [0, 0.085, 0.04],
    radii: [0.15, 0.138, 0.132],
  };
  let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(
    ...faceSurface.radii,
    28,
    20,
  );
  colorCreatureGeometryVertices(creatureEllipsoidGeometryResult, (value20, yValue2) =>
    lerpCreatureRigColor(
      value20,
      palette.faceLo,
      palette.face,
      smoothstepCreatureValue(-0.12, 0.1, yValue2.y),
    ),
  );
  transformCreatureGeometry(creatureEllipsoidGeometryResult, faceSurface.center);
  let creatureSphereClusterGeometryResult = createCreatureSphereClusterGeometry([
    {
      p: [0, 0.2, 0.08],
      r: 0.04,
    },
    {
      p: [-0.045, 0.19, 0.07],
      r: 0.034,
    },
    {
      p: [0.045, 0.19, 0.07],
      r: 0.034,
    },
  ]);
  fillCreatureGeometryColor(creatureSphereClusterGeometryResult, palette.ruff);
  addCreatureBoneMesh(
    head,
    creatureEllipsoidGeometryResult,
    materials.bodyLum,
    null,
    null,
    `headMesh`,
  );
  addCreatureBoneMesh(head, creatureSphereClusterGeometryResult, materials.fluffLum);
  return {
    head,
    faceSurface,
  };
}
