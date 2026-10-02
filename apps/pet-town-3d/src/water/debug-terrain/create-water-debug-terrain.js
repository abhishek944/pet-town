/** Optional isolated terrain for water visualization and diagnostics. */
import * as THREE from "three";
export function createWaterDebugTerrain(context, value) {
  let indexBuffer = new Int16Array(5184);
  let result = Math.round(value);
  let callback = (value2, value3) =>
    Math.sin(value2 * 0.31 + Math.cos(value3 * 0.23) * 1.7) * 0.5 +
    Math.sin(value3 * 0.27 - value2 * 0.11) * 0.5;
  for (let index2 = 0; index2 < 72; index2++) {
    for (let index3 = 0; index3 < 72; index3++) {
      let result2 = index3 - 36 + 0.5;
      let result3 = index2 - 36 + 0.5;
      let result4 = Math.hypot((result2 - 2) / 1.15, result3 + 1) / 20;
      let result5 =
        result - 4.2 * Math.max(0, 1 - result4 * result4) + 1.2 + callback(result2, result3) * 0.9;
      result5 = Math.max(result5, result - 5);
      if (result4 > 0.95) {
        result5 = Math.max(
          result5,
          result + (result4 - 0.95) * 9 + callback(result3, result2) * 1.2,
        );
      }
      let hypotResult = Math.hypot(result2 + 20, result3 + 18);
      if (hypotResult < 14) {
        result5 = Math.max(result5, result + 5 - hypotResult * 0.45);
      }
      let hypotResult2 = Math.hypot(result2 - 7, result3 + 4);
      if (hypotResult2 < 3.4) {
        result5 = Math.max(result5, result + 1 - hypotResult2 * 0.35);
      }
      if (Math.hypot(result2 + 6, result3 - 5) < 1.2) {
        result5 = result + 2;
      }
      if (Math.abs(result2 - 12) < 0.6 && result3 > 8 && result3 < 16) {
        result5 = result + 1;
      }
      indexBuffer[index2 * 72 + index3] = Math.max(1, Math.round(result5));
    }
  }
  let callback2 = (value4, value5) => {
    let result6 = Math.floor(value4 + 36);
    let result7 = Math.floor(value5 + 36);
    return result6 < 0 || result7 < 0 || result6 >= 72 || result7 >= 72
      ? 0
      : indexBuffer[result7 * 72 + result6];
  };
  let group2 = new THREE.Group();
  group2.name = `water-test-terrain`;
  let instancedMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      roughness: 0.9,
    }),
    5184,
  );
  let matrix = new THREE.Matrix4();
  let color = new THREE.Color();
  let color2 = new THREE.Color(15982502);
  let color3 = new THREE.Color(14862732);
  let color4 = new THREE.Color(8836190);
  let color5 = new THREE.Color(12170925);
  let index = 0;
  for (let index4 = 0; index4 < 72; index4++) {
    for (let index5 = 0; index5 < 72; index5++) {
      let result8 = indexBuffer[index4 * 72 + index5];
      matrix.makeScale(1, result8, 1);
      matrix.setPosition(index5 - 36 + 0.5, result8 / 2, index4 - 36 + 0.5);
      instancedMesh.setMatrixAt(index, matrix);
      let result9 = index5 - 36 + 0.5;
      let result10 = index4 - 36 + 0.5;
      if (
        Math.hypot(result9 + 6, result10 - 5) < 1.2 ||
        (Math.abs(result9 - 12) < 0.6 && result10 > 8 && result10 < 16)
      ) {
        color.copy(color5);
      } else {
        if (result8 < result) {
          color.copy(color3).lerp(color2, ((index5 * 7 + index4 * 13) % 5) / 10);
        } else {
          if (result8 <= result + 1) {
            color.copy(color2).offsetHSL(0, 0, (((index5 * 3 + index4 * 5) % 4) - 1.5) * 0.012);
          } else {
            color.copy(color4).offsetHSL(0, 0, (((index5 * 3 + index4 * 5) % 4) - 1.5) * 0.015);
          }
        }
      }
      instancedMesh.setColorAt(index++, color);
    }
  }
  instancedMesh.castShadow = instancedMesh.receiveShadow = true;
  group2.add(instancedMesh);
  context.scene.add(group2);
  if (context.terrain?.group) {
    context.terrain.group.visible = false;
  }
  context.terrain = Object.assign(context.terrain ?? {}, {
    size: 72,
    heightAt: callback2,
    topY: callback2,
    blockAt: (value6, value7, value8) => +(value7 >= 0 && value7 < callback2(value6, value8)),
    waterLevel: value,
    group: group2,
  });
  return {
    heightAt: callback2,
    group: group2,
  };
}
