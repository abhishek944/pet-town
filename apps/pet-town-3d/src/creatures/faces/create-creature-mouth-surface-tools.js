/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
import { sampleCreatureFaceSurface } from "./sample-creature-face-surface.js";
import { createCreatureSurfaceBasis } from "../geometry/create-creature-surface-basis.js";
import { colorCreatureGeometryVertices } from "../geometry/color-creature-geometry-vertices.js";
import { getCreatureColor } from "../geometry/get-creature-color.js";
import { creaturesState } from "../state.js";
import { createCreatureTaperedTubeGeometry } from "../geometry/create-creature-tapered-tube-geometry.js";
import { projectCreatureFaceCurve } from "./project-creature-face-curve.js";
import { projectCreaturePointOntoEllipsoid } from "../geometry/project-creature-point-onto-ellipsoid.js";
import { creatureEllipsoidNormal } from "../geometry/creature-ellipsoid-normal.js";
import { mergeCreatureGeometries } from "../geometry/merge-creature-geometries.js";
export function createCreatureMouthSurfaceTools(mouthSurface, mouth, strokeWidth, anchor) {
  let placeMouth = (group, pitchOffset, inset) => {
    let creatureFaceSurfaceResult4 = sampleCreatureFaceSurface(
      mouthSurface,
      mouth.yaw ?? 0,
      mouth.pitch - pitchOffset,
    );
    group.position
      .copy(creatureFaceSurfaceResult4.p)
      .addScaledVector(creatureFaceSurfaceResult4.n, -inset);
    group.quaternion.setFromRotationMatrix(
      createCreatureSurfaceBasis(creatureFaceSurfaceResult4.n),
    );
    return group;
  };
  let flattenMouth = (geometry, depthScale = 0.3) => {
    let position6 = geometry.attributes.position;
    let vector = new THREE.Vector3(...mouthSurface.center);
    let vector2 = new THREE.Vector3();
    let vector3 = new THREE.Vector3();
    let vector4 = new THREE.Vector3();
    for (let index6 = 0; index6 < position6.count; index6++) {
      vector2.fromBufferAttribute(position6, index6).sub(vector);
      projectCreaturePointOntoEllipsoid(vector2, mouthSurface.radii, vector3);
      creatureEllipsoidNormal(vector3, mouthSurface.radii, vector4);
      let result26 = vector2.clone().sub(vector3).dot(vector4);
      vector2
        .copy(vector3)
        .addScaledVector(vector4, result26 * depthScale + strokeWidth * 0.12)
        .add(vector);
      position6.setXYZ(index6, vector2.x, vector2.y, vector2.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  };
  let createSmile = (style, smileWidth = mouth.w, smileInkWidth = strokeWidth) => {
    let values5 = [];
    let callback9 = (value27, value28, value29, value30 = 10) => {
      let values6 = [];
      for (let index7 = 0; index7 <= value30; index7++) {
        let result27 = index7 / value30;
        let result28 = value27 + (value28 - value27) * result27;
        values6.push([result28, -value29 * Math.sin(Math.PI * result27)]);
      }
      return values6;
    };
    if (style === `cat`) {
      values5.push(
        callback9(-smileWidth, 0, smileWidth * 0.55),
        callback9(0, smileWidth, smileWidth * 0.55),
      );
    } else {
      if (style === `wide`) {
        values5.push(callback9(-smileWidth, smileWidth, smileWidth * 0.22, 18));
      } else {
        values5.push(callback9(-smileWidth, smileWidth, smileWidth * 0.45));
      }
    }
    return flattenMouth(
      mergeCreatureGeometries(
        values5.map((value31) =>
          colorCreatureGeometryVertices(
            createCreatureTaperedTubeGeometry(
              projectCreatureFaceCurve(mouthSurface, anchor, value31, smileInkWidth * 0.4),
              (value32) => smileInkWidth * (0.55 + 0.6 * Math.sin(Math.PI * value32)),
              {
                tSeg: 16,
                rSeg: 6,
              },
            ),
            (copyValue4) => copyValue4.copy(getCreatureColor(creaturesState.creatureFaceInkColor)),
          ),
        ),
      ),
    );
  };
  return {
    placeMouth,
    flattenMouth,
    createSmile,
  };
}
