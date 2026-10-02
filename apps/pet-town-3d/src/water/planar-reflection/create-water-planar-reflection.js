/** Mirrored camera render target and clip plane with render-state restoration. */
import * as THREE from "three";
export function createWaterPlanarReflection() {
  let webGLRenderTarget = new THREE.WebGLRenderTarget(2, 2, {
    type: THREE.HalfFloatType,
    depthBuffer: true,
    samples: 0,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    colorSpace: THREE.LinearSRGBColorSpace,
  });
  webGLRenderTarget.texture.name = `Water.reflection`;
  let perspectiveCamera = new THREE.PerspectiveCamera();
  let matrix = new THREE.Matrix4();
  let plane = new THREE.Plane();
  let vector4 = new THREE.Vector4();
  let vector42 = new THREE.Vector4();
  let vector = new THREE.Vector3(0, 1, 0);
  let vector2 = new THREE.Vector3();
  let vector3 = new THREE.Vector3();
  let vector5 = new THREE.Vector3();
  let vector6 = new THREE.Vector3();
  let matrix2 = new THREE.Matrix4();
  let vector7 = new THREE.Vector3();
  let point = new THREE.Vector2();
  let enabled2 = false;
  function result(
    getSizeValue,
    value,
    isPerspectiveCameraValue,
    value2,
    value3,
    mapValue,
    value4 = 260,
  ) {
    if (
      enabled2 ||
      !isPerspectiveCameraValue.isPerspectiveCamera ||
      (vector3.setFromMatrixPosition(isPerspectiveCameraValue.matrixWorld),
      vector3.y <= value2 + 0.02)
    ) {
      return false;
    }
    vector2.set(vector3.x, value2, vector3.z);
    vector5.subVectors(vector2, vector3).reflect(vector).negate().add(vector2);
    matrix2.extractRotation(isPerspectiveCameraValue.matrixWorld);
    vector7.set(0, 0, -1).applyMatrix4(matrix2).add(vector3);
    vector6.subVectors(vector2, vector7).reflect(vector).negate().add(vector2);
    perspectiveCamera.position.copy(vector5);
    perspectiveCamera.up.set(0, 1, 0).applyMatrix4(matrix2).reflect(vector);
    perspectiveCamera.lookAt(vector6);
    perspectiveCamera.near = isPerspectiveCameraValue.near;
    perspectiveCamera.far = Math.min(isPerspectiveCameraValue.far, value4);
    perspectiveCamera.fov = isPerspectiveCameraValue.fov;
    perspectiveCamera.aspect = isPerspectiveCameraValue.aspect;
    perspectiveCamera.zoom = isPerspectiveCameraValue.zoom;
    perspectiveCamera.updateMatrixWorld();
    perspectiveCamera.updateProjectionMatrix();
    perspectiveCamera.layers.mask = isPerspectiveCameraValue.layers.mask;
    perspectiveCamera.layers.disable(7);
    matrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    matrix
      .multiply(perspectiveCamera.projectionMatrix)
      .multiply(perspectiveCamera.matrixWorldInverse);
    plane
      .setFromNormalAndCoplanarPoint(vector, vector2)
      .applyMatrix4(perspectiveCamera.matrixWorldInverse);
    vector4.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    let elements2 = perspectiveCamera.projectionMatrix.elements;
    vector42.x = (Math.sign(vector4.x) + elements2[8]) / elements2[0];
    vector42.y = (Math.sign(vector4.y) + elements2[9]) / elements2[5];
    vector42.z = -1;
    vector42.w = (1 + elements2[10]) / elements2[14];
    vector4.multiplyScalar(2 / vector4.dot(vector42));
    elements2[2] = vector4.x;
    elements2[6] = vector4.y;
    elements2[10] = vector4.z + 1 - 0.003;
    elements2[14] = vector4.w;
    perspectiveCamera.projectionMatrixInverse.copy(perspectiveCamera.projectionMatrix).invert();
    getSizeValue.getSize(point);
    let result2 = Math.max(2, Math.round(point.x * value3));
    let result3 = Math.max(2, Math.round(point.y * value3));
    if (webGLRenderTarget.width !== result2 || webGLRenderTarget.height !== result3) {
      webGLRenderTarget.setSize(result2, result3);
    }
    let renderTargetResult = getSizeValue.getRenderTarget();
    let activeCubeFaceResult = getSizeValue.getActiveCubeFace();
    let activeMipmapLevelResult = getSizeValue.getActiveMipmapLevel();
    let enabled3 = getSizeValue.xr.enabled;
    let autoUpdate2 = getSizeValue.shadowMap.autoUpdate;
    let result4 = mapValue.map((visibleValue) => visibleValue.visible);
    enabled2 = true;
    try {
      mapValue.forEach((visibleValue2) => (visibleValue2.visible = false));
      getSizeValue.xr.enabled = false;
      getSizeValue.shadowMap.autoUpdate = false;
      getSizeValue.setRenderTarget(webGLRenderTarget);
      getSizeValue.state.buffers.depth.setMask(true);
      if (getSizeValue.autoClear === false) {
        getSizeValue.clear();
      }
      getSizeValue.render(value, perspectiveCamera);
    } finally {
      mapValue.forEach((visibleValue3, value5) => (visibleValue3.visible = result4[value5]));
      getSizeValue.xr.enabled = enabled3;
      getSizeValue.shadowMap.autoUpdate = autoUpdate2;
      getSizeValue.setRenderTarget(
        renderTargetResult,
        activeCubeFaceResult,
        activeMipmapLevelResult,
      );
      let viewport2 = isPerspectiveCameraValue.viewport;
      if (viewport2 !== undefined) {
        getSizeValue.state.viewport(viewport2);
      }
      enabled2 = false;
    }
    return true;
  }
  return {
    rt: webGLRenderTarget,
    texMatrix: matrix,
    render: result,
    camera: perspectiveCamera,
    dispose() {
      webGLRenderTarget.dispose();
    },
  };
}
