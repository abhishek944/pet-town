/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
import * as THREE from "three";
export function createCreatureSleepTexture() {
  let element = document.createElement(`canvas`);
  element.width = 96;
  element.height = 64;
  let painter = element.getContext(`2d`);
  painter.textAlign = `center`;
  painter.textBaseline = `middle`;
  let callback = (value, value2, value3, value4) => {
    painter.font = `900 ${value4}px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif`;
    painter.lineWidth = value4 * 0.2;
    painter.strokeStyle = `rgba(255,255,255,0.95)`;
    painter.strokeText(value, value2, value3);
    painter.lineWidth = value4 * 0.08;
    painter.strokeStyle = `#5a5ac8`;
    painter.strokeText(value, value2, value3);
    painter.fillStyle = `#c8c8ff`;
    painter.fillText(value, value2, value3);
  };
  callback(`Z`, 34, 38, 42);
  callback(`z`, 68, 22, 28);
  let texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
