/** Canopy surface intersections, rounded clumps and silhouette fringe cards. */
import * as THREE from "three";
import { vegetationFractalNoise3d } from "../random/vegetation-fractal-noise3d.js";
export function configureCanopyClumps(canopy) {
  ({
    stops: canopy.colorStops,
    sphereBlend: canopy.sphereBlend = 0.3,
    swayBase: canopy.swayBase = 1,
    aoMin: canopy.aoMin = 0.6,
    seg: canopy.segments = 4,
    dispAmp: canopy.displacement = 0.08,
    dispFreq: canopy.noiseFrequency = 1.15,
    cards: canopy.cardDensity = 0.5,
    cardSize: canopy.cardSize = [0.15, 0.3],
  } = canopy.settings);
  canopy.seed = canopy.settings.seed ?? Math.floor(canopy.random() * 1e6);
  canopy.bottomY = canopy.center.y - canopy.radius * 1;
  canopy.topY = canopy.center.y + canopy.radius * 1;
  canopy.normalOrigin = canopy.center.clone().add(new THREE.Vector3(0, -canopy.radius * 0.35, 0));
  canopy.rotation = new THREE.Euler();
  canopy.quaternion = new THREE.Quaternion();
  canopy.transforms = canopy.clumps.map((position2) => {
    canopy.rotation.set(position2.rx ?? 0, position2.ry ?? 0, position2.rz ?? 0);
    canopy.quaternion.setFromEuler(canopy.rotation);
    return new THREE.Matrix4().compose(
      new THREE.Vector3(position2.x, position2.y, position2.z),
      canopy.quaternion.clone(),
      new THREE.Vector3(1, 1, 1),
    );
  });
  canopy.inverseTransforms = canopy.transforms.map((cloneValue) => cloneValue.clone().invert());
  canopy.roundingRadii = canopy.clumps.map(
    (wValue) => Math.min(wValue.w, wValue.h, wValue.d) * (wValue.round ?? 0.42),
  );
  canopy.localPosition = new THREE.Vector3();
  canopy.signedClumpDistance = (value3, value4) => {
    canopy.localPosition.copy(value4).applyMatrix4(canopy.inverseTransforms[value3]);
    let result10 = canopy.clumps[value3];
    let result11 = canopy.roundingRadii[value3];
    let result12 = Math.abs(canopy.localPosition.x) - (result10.w / 2 - result11);
    let result13 = Math.abs(canopy.localPosition.y) - (result10.h / 2 - result11);
    let result14 = Math.abs(canopy.localPosition.z) - (result10.d / 2 - result11);
    return (
      Math.hypot(Math.max(result12, 0), Math.max(result13, 0), Math.max(result14, 0)) +
      Math.min(Math.max(result12, result13, result14), 0) -
      result11
    );
  };
  canopy.neighborClumpDistance = (value5, value6) => {
    let result15 = 1e9;
    for (let index2 = 0; index2 < canopy.clumps.length; index2++) {
      if (index2 !== value5) {
        result15 = Math.min(result15, canopy.signedClumpDistance(index2, value6));
      }
    }
    return result15;
  };
  canopy.noiseAt = (value7, value8, value9) =>
    vegetationFractalNoise3d(
      value7 * canopy.noiseFrequency,
      value8 * canopy.noiseFrequency,
      value9 * canopy.noiseFrequency,
      canopy.seed,
      2,
    );
  canopy.radialNormal = new THREE.Vector3();
}
