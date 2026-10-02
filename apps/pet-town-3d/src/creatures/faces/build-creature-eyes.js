/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
import { sampleCreatureFaceSurface } from "./sample-creature-face-surface.js";
import { createCreatureSurfaceBasis } from "../geometry/create-creature-surface-basis.js";
import { createCreatureIrisGeometry } from "./create-creature-iris-geometry.js";
import { colorCreatureGeometryVertices } from "../geometry/color-creature-geometry-vertices.js";
import { createCreatureEyeHighlightsGeometry } from "./create-creature-eye-highlights-geometry.js";
import { getCreatureColor } from "../geometry/get-creature-color.js";
import { creaturesState } from "../state.js";
import { createCreatureTaperedTubeGeometry } from "../geometry/create-creature-tapered-tube-geometry.js";
import { createCreatureFacePartGroup } from "./create-creature-face-part-group.js";
export function buildCreatureEyes(definition, materials, parent, face) {
  let eye = definition.eye;
  let eyeStyle = eye.style ?? `round`;
  let [eyeWidth, eyeHeight, eyeDepth] = eye.size;
  let inkWidth = eye.ink ?? Math.max(0.006, Math.min(eyeWidth, eyeHeight) * 0.14);
  let surface = eye.surface ?? definition.surface;
  let surfaceRadius = Math.min(...(eye.surfaces ? eye.surfaces[0].radii : surface.radii));
  for (let result5 of [-1, 1]) {
    let creatureFaceSurfaceResult = sampleCreatureFaceSurface(
      eye.surfaces ? eye.surfaces[result5 < 0 ? 0 : 1] : surface,
      result5 * eye.yaw,
      eye.pitch,
    );
    let group = new THREE.Group();
    group.name = result5 < 0 ? `eyeL` : `eyeR`;
    group.position
      .copy(creatureFaceSurfaceResult.p)
      .addScaledVector(creatureFaceSurfaceResult.n, -eyeDepth * (eye.sink ?? 0.35));
    group.quaternion.setFromRotationMatrix(createCreatureSurfaceBasis(creatureFaceSurfaceResult.n));
    let group2 = new THREE.Group();
    group2.name = `open`;
    if (eye.roll) {
      group2.rotation.z = -result5 * eye.roll;
    }
    let mesh = new THREE.Mesh(
      createCreatureIrisGeometry(
        eyeWidth,
        eyeHeight,
        eyeDepth,
        eye.iris,
        eye.top ?? 1313822,
        eyeStyle,
      ),
      materials.eye,
    );
    if ((group2.add(mesh), eyeStyle === `bulge`)) {
      let result9 = eye.pupil ?? 0.55;
      let result10 = -result5 * 0.14;
      let mesh2 = new THREE.Mesh(
        colorCreatureGeometryVertices(
          createCreatureEyeHighlightsGeometry(
            [
              {
                x: result10,
                y: -0.04,
                sx: result9,
                sy: result9 * 1.05,
              },
            ],
            eyeWidth,
            eyeHeight,
            eyeDepth,
            1.01,
          ),
          (copyValue) => copyValue.copy(getCreatureColor(1314828)),
        ),
        materials.eye,
      );
      let mesh3 = new THREE.Mesh(
        createCreatureEyeHighlightsGeometry(
          creaturesState.creatureEyeHighlightPatterns.full.map((xValue) => ({
            ...xValue,
            x: xValue.x * 0.8 + result10 * 0.5,
            sx: xValue.sx * 0.75,
            sy: xValue.sy * 0.75,
          })),
          eyeWidth,
          eyeHeight,
          eyeDepth,
          1.02,
        ),
        materials.white,
      );
      group2.add(mesh2, mesh3);
    } else {
      let result11 =
        eyeStyle === `shy`
          ? creaturesState.creatureEyeHighlightPatterns.single
          : eyeStyle === `bead`
            ? creaturesState.creatureEyeHighlightPatterns.bead
            : creaturesState.creatureEyeHighlightPatterns.full;
      group2.add(
        new THREE.Mesh(
          createCreatureEyeHighlightsGeometry(result11, eyeWidth, eyeHeight, eyeDepth),
          materials.white,
        ),
      );
    }
    let result6 = eyeDepth * (1 - (eye.sink ?? 0.35)) * 0.55;
    let callback2 = (value, value2 = inkWidth, value3 = 0.75) =>
      colorCreatureGeometryVertices(
        createCreatureTaperedTubeGeometry(
          value,
          (value4) => value2 * (value3 + (1.1 - value3) * Math.sin(Math.PI * value4)),
          {
            tSeg: 16,
            rSeg: 6,
          },
        ),
        (copyValue2) => copyValue2.copy(getCreatureColor(creaturesState.creatureFaceInkColor)),
      );
    let callback3 = (value5) => result6 + eyeDepth * 0.35 - (value5 * value5) / (2 * surfaceRadius);
    let creatureFacePartGroupResult = createCreatureFacePartGroup(
      `shut`,
      ((value6, value7 = 0.95) => {
        let values = [];
        for (let index = 0; index <= 8; index++) {
          let result12 = (index / 8) * 2 - 1;
          let result13 = result12 * eyeWidth * value7;
          values.push(new THREE.Vector3(result13, value6(result12), callback3(result13)));
        }
        return callback2(values);
      })((value8) => -eyeHeight * 0.18 - eyeHeight * 0.3 * (1 - value8 * value8)),
      materials.eye,
    );
    let result7 = definition.happy?.eyes ?? `arc`;
    let result8;
    if (result7 === `squeeze`) {
      let result14 = -result5;
      let result15 = eyeWidth * 0.9;
      let result16 = eyeHeight * 0.55;
      let result17 = [
        [-result15 * result14, result16],
        [result15 * 0.55 * result14, 0],
        [-result15 * result14, -result16],
      ].map(([value9, value10]) => new THREE.Vector3(value9, value10, callback3(value9)));
      result8 = callback2(
        [
          result17[0],
          result17[0].clone().lerp(result17[1], 0.5),
          result17[1],
          result17[1].clone().lerp(result17[2], 0.5),
          result17[2],
        ],
        inkWidth * 1.1,
      );
    } else {
      let values2 = [];
      for (let index2 = 0; index2 <= 10; index2++) {
        let result18 = (index2 / 10) * 2 - 1;
        let result19 = result18 * eyeWidth * 0.85;
        values2.push(
          new THREE.Vector3(
            result19,
            -eyeHeight * 0.42 + eyeHeight * 0.8 * Math.cos((result18 * Math.PI) / 2) ** 1.4,
            callback3(result19),
          ),
        );
      }
      result8 = callback2(values2, inkWidth * 1.05, 0.3);
    }
    let creatureFacePartGroupResult2 = createCreatureFacePartGroup(`happy`, result8, materials.eye);
    group.add(group2, creatureFacePartGroupResult, creatureFacePartGroupResult2);
    parent.add(group);
    face.eyes.push({
      root: group,
      open: group2,
      shut: creatureFacePartGroupResult,
      happy: creatureFacePartGroupResult2,
    });
  }
  return {
    inkWidth,
  };
}
