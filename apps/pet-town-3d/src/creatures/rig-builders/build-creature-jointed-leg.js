/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
import * as THREE from "three";
import { configureCreatureLegBone } from "./configure-creature-leg-bone.js";
import { createCreatureBone } from "./create-creature-bone.js";
import { createCreatureTaperedTubeGeometry } from "../geometry/create-creature-tapered-tube-geometry.js";
import { createCreatureRigVector } from "./create-creature-rig-vector.js";
import { lerpCreatureValue } from "../math/lerp-creature-value.js";
import { smoothstepCreatureValue } from "../math/smoothstep-creature-value.js";
import { colorCreatureGeometryVertices } from "../geometry/color-creature-geometry-vertices.js";
import { addCreatureBoneMesh } from "./add-creature-bone-mesh.js";
import { createCreatureEllipsoidGeometry } from "../geometry/create-creature-ellipsoid-geometry.js";
import { createCreatureBodyGeometry } from "../geometry/create-creature-body-geometry.js";
import { getCreatureColor } from "../geometry/get-creature-color.js";
import { transformCreatureGeometry } from "../geometry/transform-creature-geometry.js";
import { mergeCreatureGeometries } from "../geometry/merge-creature-geometries.js";
export function buildCreatureJointedLeg(
  value,
  value2,
  {
    r: value6 = 0.05,
    rk: value7 = value6 * 0.7,
    r2: value8 = value7 * 0.9,
    len: value9 = 0.2,
    knee: value10 = 0.55,
    phase: value11 = 0,
    amp: value12 = 0.6,
    col: value3,
    mat: value4,
    rot: value13 = [0, 0, 0],
    kneeRot: value14 = [0, 0, 0],
    paw: value15 = 1,
    bulge: value16 = 0.22,
    kneeBulge: value17 = 1.18,
    pawCol: value5,
    pawShape: value18 = `paw`,
  } = {},
) {
  let configureCreatureLegBoneResult = configureCreatureLegBone(
    createCreatureBone(`leg`, value, value2, value13),
    value11,
    {
      amp: value12,
    },
  );
  let result = value9 * value10;
  let result2 = value9 - result;
  let creatureTaperedTubeGeometryResult = createCreatureTaperedTubeGeometry(
    [
      createCreatureRigVector(0, 0, 0),
      createCreatureRigVector(0, -result * 0.5, 0.004),
      createCreatureRigVector(0, -result, 0),
    ],
    (value19) =>
      lerpCreatureValue(value6, value7, smoothstepCreatureValue(0, 1, value19)) *
      (1 + value16 * Math.sin(Math.PI * Math.min(1, value19 * 1.6)) * (1 - value19)),
    {
      tSeg: 10,
      rSeg: 10,
    },
  );
  colorCreatureGeometryVertices(
    creatureTaperedTubeGeometryResult,
    (value20, value21, value22, value23) => value3(value20, value23 * value10, value22),
  );
  addCreatureBoneMesh(configureCreatureLegBoneResult, creatureTaperedTubeGeometryResult, value4);
  let group = new THREE.Group();
  group.name = `knee`;
  group.position.set(0, -result, 0);
  group.rotation.set(value14[0], value14[1], value14[2]);
  group.userData.abs = [0, 0, 0];
  configureCreatureLegBoneResult.add(group);
  let creatureEllipsoidGeometryResult = createCreatureEllipsoidGeometry(
    value7 * value17,
    value7 * value17,
    value7 * value17,
    10,
    8,
  );
  colorCreatureGeometryVertices(creatureEllipsoidGeometryResult, (value24, value25, value26) =>
    value3(value24, value10, value26),
  );
  let creatureTaperedTubeGeometryResult2 = createCreatureTaperedTubeGeometry(
    [
      createCreatureRigVector(0, 0, 0),
      createCreatureRigVector(0, -result2 * 0.5, -0.003),
      createCreatureRigVector(0, -result2, 0),
    ],
    (value27) => lerpCreatureValue(value7 * 0.95, value8, value27),
    {
      tSeg: 8,
      rSeg: 10,
    },
  );
  colorCreatureGeometryVertices(
    creatureTaperedTubeGeometryResult2,
    (value28, value29, value30, value31) =>
      value3(value28, value10 + value31 * (1 - value10), value30),
  );
  let result3;
  if (value18 === `tip`) {
    result3 = createCreatureBodyGeometry(value8 * 1.05, value8 * 1.9, value8 * 1.05, {
      taper: 0.55,
      ws: 12,
      hs: 9,
    });
    result3.rotateX(Math.PI);
    colorCreatureGeometryVertices(result3, (copyValue, value32, value33) => {
      if (value5) {
        copyValue.copy(getCreatureColor(value5));
      } else {
        value3(copyValue, 1, value33);
      }
    });
    transformCreatureGeometry(result3, [0, -result2 - value8 * 0.9, 0]);
  } else {
    result3 = createCreatureEllipsoidGeometry(
      value8 * 1.35 * value15,
      value8 * 0.66,
      value8 * 1.7 * value15,
      14,
      9,
    );
    colorCreatureGeometryVertices(result3, (copyValue2, value34, yValue) => {
      if (value5) {
        copyValue2.copy(getCreatureColor(value5));
      } else {
        value3(copyValue2, 1, yValue);
      }
      copyValue2.multiplyScalar(0.92 + 0.12 * smoothstepCreatureValue(-0.6, 0.8, yValue.y));
    });
    transformCreatureGeometry(result3, [0, -result2 - value8 * 0.2, value8 * 0.5]);
  }
  addCreatureBoneMesh(
    group,
    mergeCreatureGeometries([
      creatureEllipsoidGeometryResult,
      creatureTaperedTubeGeometryResult2,
      result3,
    ]),
    value4,
  );
  return configureCreatureLegBoneResult;
}
