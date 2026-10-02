/** Pebbug beetle geometry, stone shell cells, moss, crystals, legs and flower. */
import * as THREE from "three";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { lerpCreatureRigColor } from "../../rig-builders/lerp-creature-rig-color.js";
import { smoothstepCreatureValue } from "../../math/smoothstep-creature-value.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { hashCreatureCoordinates } from "../../math/hash-creature-coordinates.js";
import { createCreatureSphereClusterGeometry } from "../../geometry/create-creature-sphere-cluster-geometry.js";
export function buildPebbugCrystalsAndMoss(palette, body, materials) {
  let values = [];
  [
    [0.08, 0.175, -0.12, 0.03, 0.095, -0.35, -0.3],
    [0.13, 0.145, -0.11, 0.022, 0.065, -0.85, -0.25],
    [0.06, 0.165, -0.18, 0.02, 0.06, 0.1, -0.7],
    [0.11, 0.14, -0.19, 0.017, 0.045, -0.5, -0.8],
  ].forEach(([value7, value8, value9, value10, value11, value12, value13]) => {
    let cylinderGeometry = new THREE.CylinderGeometry(value10 * 0.7, value10, value11, 6, 1);
    cylinderGeometry.translate(0, value11 / 2, 0);
    let coneGeometry = new THREE.ConeGeometry(value10 * 0.7, value10 * 1.6, 6);
    coneGeometry.translate(0, value11 + value10 * 0.8, 0);
    let mergeCreatureGeometriesResult = mergeCreatureGeometries([
      cylinderGeometry.toNonIndexed(),
      coneGeometry.toNonIndexed(),
    ]);
    mergeCreatureGeometriesResult.deleteAttribute(`normal`);
    mergeCreatureGeometriesResult.computeVertexNormals();
    colorCreatureGeometryVertices(mergeCreatureGeometriesResult, (value14, yValue2) =>
      lerpCreatureRigColor(
        value14,
        palette.crystalLo,
        palette.crystal,
        smoothstepCreatureValue(0, value11 + value10, yValue2.y),
      ),
    );
    transformCreatureGeometry(
      mergeCreatureGeometriesResult,
      [value7, value8, value9],
      [value13, 0, value12],
    );
    values.push(mergeCreatureGeometriesResult);
  });
  addCreatureBoneMesh(
    body,
    mergeCreatureGeometries(values),
    materials.crystal,
    null,
    null,
    `crystal`,
  ).castShadow = true;
  {
    let values3 = [];
    let callback = (value15, value16) => hashCreatureCoordinates(value15, value16, 11);
    for (let index = 0; index < 16; index++) {
      let result3 = -1.2 + callback(index, 1) * 2.4;
      let result4 = 0.25 + callback(index, 2) * 0.9;
      let normalizeResult = new THREE.Vector3(
        Math.sin(result3) * Math.sin(result4) - 0.25,
        Math.cos(result4),
        -Math.cos(result3) * Math.sin(result4) * 0.7,
      ).normalize();
      let result5 =
        1 /
        Math.sqrt(
          (normalizeResult.x / 0.3) ** 2 +
            (normalizeResult.y / 0.235) ** 2 +
            (normalizeResult.z / 0.33) ** 2,
        );
      values3.push({
        p: [
          normalizeResult.x * result5,
          normalizeResult.y * result5 - 0.005,
          normalizeResult.z * result5,
        ],
        r: 0.03 + 0.025 * callback(index, 3),
        s: [1, 0.55, 1],
      });
    }
    let creatureSphereClusterGeometryResult = createCreatureSphereClusterGeometry(values3, 10, 7);
    colorCreatureGeometryVertices(
      creatureSphereClusterGeometryResult,
      (multiplyScalarValue2, position2) => {
        lerpCreatureRigColor(
          multiplyScalarValue2,
          palette.moss,
          palette.mossHi,
          smoothstepCreatureValue(0.15, 0.25, position2.y) * 0.8,
        );
        multiplyScalarValue2.multiplyScalar(
          0.9 +
            0.2 *
              hashCreatureCoordinates(
                Math.round(position2.x * 60),
                Math.round(position2.z * 60),
                5,
              ),
        );
      },
    );
    addCreatureBoneMesh(body, creatureSphereClusterGeometryResult, materials.fluff);
  }
}
