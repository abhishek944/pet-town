/** Framebuffer copying and mipmap generation for water refraction. */
import * as THREE from "three";
export function createWaterSceneGrabber(canvas) {
  let painter = canvas.getContext();
  let surface = null;
  let surface2 = null;
  let properties2 = canvas.properties;
  let callback = (value, value2, value3, value4) => {
    let webGLRenderTarget = new THREE.WebGLRenderTarget(value, value2, {
      type: value3,
      depthBuffer: false,
      stencilBuffer: false,
      samples: 0,
      generateMipmaps: value4,
      minFilter: value4 ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      colorSpace: THREE.LinearSRGBColorSpace,
    });
    webGLRenderTarget.texture.name = `Water.sceneGrab`;
    canvas.initRenderTarget(webGLRenderTarget);
    return webGLRenderTarget;
  };
  let options = {
    texture: null,
    display: false,
  };
  function result(value5 = 1) {
    let renderTargetResult = canvas.getRenderTarget();
    if (
      renderTargetResult &&
      (renderTargetResult.isWebGL3DRenderTarget || renderTargetResult.isWebGLCubeRenderTarget)
    ) {
      return null;
    }
    let result2 = renderTargetResult ? renderTargetResult.texture.type : THREE.UnsignedByteType;
    if (result2 !== 1016 && result2 !== 1015 && result2 !== 1009) {
      return null;
    }
    let result3 = renderTargetResult ? renderTargetResult.width : painter.drawingBufferWidth;
    let result4 = renderTargetResult ? renderTargetResult.height : painter.drawingBufferHeight;
    let result5 = value5 < 0.99;
    if (
      !surface ||
      surface.width !== result3 ||
      surface.height !== result4 ||
      surface.texture.type !== result2
    ) {
      surface?.dispose();
      surface = callback(result3, result4, result2, !result5);
    }
    let result6 = Math.max(1, Math.round(result3 * value5));
    let result7 = Math.max(1, Math.round(result4 * value5));
    if (
      result5 &&
      (!surface2 ||
        surface2.width !== result6 ||
        surface2.height !== result7 ||
        surface2.texture.type !== result2)
    ) {
      surface2?.dispose();
      surface2 = callback(result6, result7, result2, true);
    }
    if (!result5 && surface.texture.generateMipmaps !== true) {
      surface.dispose();
      surface = callback(result3, result4, result2, true);
    }
    painter.getError();
    let parameterResult = painter.getParameter(painter.DRAW_FRAMEBUFFER_BINDING);
    let parameterResult2 = painter.getParameter(painter.READ_FRAMEBUFFER_BINDING);
    let __webglFramebuffer2 = properties2.get(surface).__webglFramebuffer;
    if (!__webglFramebuffer2) {
      return null;
    }
    let isEnabledResult = painter.isEnabled(painter.SCISSOR_TEST);
    if (isEnabledResult) {
      painter.disable(painter.SCISSOR_TEST);
    }
    painter.bindFramebuffer(painter.READ_FRAMEBUFFER, parameterResult);
    painter.bindFramebuffer(painter.DRAW_FRAMEBUFFER, __webglFramebuffer2);
    painter.blitFramebuffer(
      0,
      0,
      result3,
      result4,
      0,
      0,
      result3,
      result4,
      painter.COLOR_BUFFER_BIT,
      painter.NEAREST,
    );
    let surfaceValue = surface;
    if (result5) {
      let __webglFramebuffer3 = properties2.get(surface2).__webglFramebuffer;
      painter.bindFramebuffer(painter.READ_FRAMEBUFFER, __webglFramebuffer2);
      painter.bindFramebuffer(painter.DRAW_FRAMEBUFFER, __webglFramebuffer3);
      painter.blitFramebuffer(
        0,
        0,
        result3,
        result4,
        0,
        0,
        result6,
        result7,
        painter.COLOR_BUFFER_BIT,
        painter.LINEAR,
      );
      surfaceValue = surface2;
    }
    painter.bindFramebuffer(painter.READ_FRAMEBUFFER, parameterResult2);
    painter.bindFramebuffer(painter.DRAW_FRAMEBUFFER, parameterResult);
    if (isEnabledResult) {
      painter.enable(painter.SCISSOR_TEST);
    }
    let result8 = properties2.get(surfaceValue.texture);
    canvas.state.bindTexture(painter.TEXTURE_2D, result8.__webglTexture);
    painter.generateMipmap(painter.TEXTURE_2D);
    canvas.state.unbindTexture();
    return painter.getError() === painter.NO_ERROR
      ? ((options.texture = surfaceValue.texture), (options.display = !renderTargetResult), options)
      : null;
  }
  return {
    grab: result,
    dispose() {
      surface?.dispose();
      surface2?.dispose();
    },
  };
}
