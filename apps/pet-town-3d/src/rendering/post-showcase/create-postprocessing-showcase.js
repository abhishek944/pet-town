/** Optional postprocessing diagnostic scene. */
import * as THREE from "three";
export function createPostprocessingShowcase(context) {
  let { scene: terrainValueValue } = context;
  let group = new THREE.Group();
  group.name = `postTestScene`;
  let callback = (value, value2) => context.terrain?.heightAt?.(value, value2) ?? 0;
  let callback2 = (value3, value4 = {}) =>
    new THREE.MeshStandardMaterial({
      color: value3,
      roughness: 0.85,
      ...value4,
    });
  let callback3 = (value5, value6, value7, value8, value9, value10, value11) => {
    let mesh4 = new THREE.Mesh(new THREE.BoxGeometry(value5, value6, value7), value8);
    mesh4.position.set(value9, value10, value11);
    mesh4.castShadow = mesh4.receiveShadow = true;
    group.add(mesh4);
    return mesh4;
  };
  let callbackResult = callback(4, 6);
  callback3(5, 3, 4, callback2(16773590), 4, callbackResult + 1.5, 6);
  let callback2Result = callback2(14706778);
  let callback3Result = callback3(3.2, 0.4, 4.6, callback2Result, 2.8, callbackResult + 3.6, 6);
  callback3Result.rotation.z = 0.6;
  let callback3Result2 = callback3(3.2, 0.4, 4.6, callback2Result, 5.2, callbackResult + 3.6, 6);
  callback3Result2.rotation.z = -0.6;
  callback3(1, 1.6, 0.2, callback2(10119749), 4, callbackResult + 0.8, 8.05);
  let callback2Result2 = callback2(16767114, {
    emissive: 16757575,
    emissiveIntensity: 2.2,
  });
  callback3(0.8, 0.8, 0.1, callback2Result2, 2.5, callbackResult + 1.8, 8.02);
  callback3(0.8, 0.8, 0.1, callback2Result2, 5.5, callbackResult + 1.8, 8.02);
  for (let [result2, result3, result4] of [
    [-6, 2, 1.1],
    [-3, 10, 0.9],
    [10, 0, 1.2],
    [-9, -6, 1],
    [12, 9, 0.8],
  ]) {
    let callbackResult3 = callback(result2, result3);
    callback3(
      0.8,
      2.5 * result4,
      0.8,
      callback2(9067067),
      result2,
      callbackResult3 + 1.25 * result4,
      result3,
    );
    let mesh5 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.1 * result4, 0),
      callback2(result2 > 0 ? 6274898 : 15902659, {
        flatShading: true,
      }),
    );
    mesh5.position.set(result2, callbackResult3 + 3.3 * result4, result3);
    mesh5.castShadow = mesh5.receiveShadow = true;
    group.add(mesh5);
    context.fx?.addTree?.([result2, callbackResult3, result3], {
      kind: result2 > 0 ? `leafy` : `blossom`,
      canopyY: callbackResult3 + 3.3 * result4,
      radius: 1.8 * result4,
    });
  }
  for (let [result5, result6] of [
    [1, 9],
    [8, 3],
  ]) {
    let callbackResult4 = callback(result5, result6);
    callback3(0.25, 2.6, 0.25, callback2(4868693), result5, callbackResult4 + 1.3, result6);
    let mesh6 = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 16773312,
        emissive: 16762984,
        emissiveIntensity: 5,
      }),
    );
    mesh6.position.set(result5, callbackResult4 + 2.8, result6);
    group.add(mesh6);
  }
  let callbackResult2 = callback(0, 3);
  let mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 32, 24),
    callback2(16758473, {
      roughness: 0.6,
    }),
  );
  mesh.position.set(0, callbackResult2 + 0.9, 3);
  mesh.scale.set(1, 0.9, 1);
  mesh.castShadow = true;
  group.add(mesh);
  for (let result7 of [-1, 1]) {
    let mesh7 = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 8),
      callback2(2236979, {
        roughness: 0.3,
      }),
    );
    mesh7.position.set(0 + result7 * 0.32, callbackResult2 + 1.05, 3.8);
    group.add(mesh7);
    let mesh8 = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 12), callback2(16758473));
    mesh8.position.set(0 + result7 * 0.45, callbackResult2 + 1.85, 3);
    mesh8.rotation.z = -result7 * 0.4;
    mesh8.castShadow = true;
    group.add(mesh8);
  }
  let mesh2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 32, 24),
    new THREE.MeshStandardMaterial({
      color: 7321599,
      roughness: 0.08,
      metalness: 0.1,
    }),
  );
  mesh2.position.set(-2, callback(-2, 6) + 0.6, 6);
  mesh2.castShadow = true;
  group.add(mesh2);
  let values = [16740241, 16765788, 16777215, 11836671];
  for (let index = 0; index < 40; index++) {
    let result8 = -8 + Math.random() * 16;
    let result9 = -2 + Math.random() * 14;
    callback3(
      0.25,
      0.25,
      0.25,
      callback2(values[index % 4]),
      result8,
      callback(result8, result9) + 0.2,
      result9,
    );
  }
  for (let index2 = 0; index2 < 8; index2++) {
    let result10 = -4 + index2;
    callback3(0.18, 0.9, 0.18, callback2(16775406), result10, callback(result10, 13) + 0.45, 13);
  }
  let result = context.water?.level ?? 6.5;
  let mesh3 = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({
      color: 5818344,
      roughness: 0.1,
      transparent: true,
      opacity: 0.75,
    }),
  );
  mesh3.rotation.x = -Math.PI / 2;
  mesh3.position.set(-25, result, -25);
  group.add(mesh3);
  context.water ||= {
    level: result,
  };
  terrainValueValue.add(group);
  context.__postTest = group;
  return group;
}
