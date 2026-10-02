/** Generated wood, brick, shingle, stone, plaster, rock, soil, cloth, window and effect textures. */
import * as THREE from "three";
import { createPropTextureCanvas } from "./create-prop-texture-canvas.js";
export function createFlameParticleTexture() {
  let [propTextureCanvasResult, propTextureCanvasResult2] = createPropTextureCanvas(128, 192);
  let callback = (value, value2, value3) => {
    propTextureCanvasResult2.save();
    propTextureCanvasResult2.translate(64, 178);
    propTextureCanvasResult2.scale(value, value);
    propTextureCanvasResult2.shadowColor = value2;
    propTextureCanvasResult2.shadowBlur = value3;
    propTextureCanvasResult2.fillStyle = value2;
    propTextureCanvasResult2.beginPath();
    propTextureCanvasResult2.moveTo(0, -165);
    propTextureCanvasResult2.bezierCurveTo(18, -120, 52, -95, 50, -45);
    propTextureCanvasResult2.bezierCurveTo(48, -10, 25, 4, 0, 4);
    propTextureCanvasResult2.bezierCurveTo(-25, 4, -48, -10, -50, -45);
    propTextureCanvasResult2.bezierCurveTo(-52, -85, -30, -95, -22, -120);
    propTextureCanvasResult2.bezierCurveTo(-18, -100, -8, -95, -6, -110);
    propTextureCanvasResult2.bezierCurveTo(-4, -130, -8, -145, 0, -165);
    propTextureCanvasResult2.fill();
    propTextureCanvasResult2.restore();
  };
  callback(1, `rgba(255,110,24,1)`, 2);
  callback(0.74, `rgba(255,170,30,1)`, 2);
  callback(0.5, `rgba(255,224,90,1)`, 2);
  callback(0.27, `rgba(255,250,210,1)`, 2);
  let texture = new THREE.CanvasTexture(propTextureCanvasResult);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
