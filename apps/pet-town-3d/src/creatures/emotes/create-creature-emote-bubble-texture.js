/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
import * as THREE from "three";
import { drawCreatureEmoteIcon } from "./draw-creature-emote-icon.js";
export function createCreatureEmoteBubbleTexture(value) {
  let element = document.createElement(`canvas`);
  element.width = 128;
  element.height = 128;
  let painter = element.getContext(`2d`);
  painter.fillStyle = `rgba(40,40,80,0.18)`;
  painter.beginPath();
  painter.ellipse(67, 59, 40, 40 * 0.92, 0, 0, Math.PI * 2);
  painter.fill();
  painter.beginPath();
  painter.ellipse(64, 54, 40, 36, 0, 0, Math.PI * 2);
  painter.moveTo(52, 85.2);
  painter.quadraticCurveTo(60, 112, 48, 120);
  painter.quadraticCurveTo(76, 104, 76, 86);
  let linearGradientResult = painter.createLinearGradient(0, 14, 0, 94);
  linearGradientResult.addColorStop(0, `#ffffff`);
  linearGradientResult.addColorStop(1, `#eef2ff`);
  painter.fillStyle = linearGradientResult;
  painter.fill();
  painter.lineWidth = 4;
  painter.strokeStyle = `#c9d0ea`;
  painter.stroke();
  drawCreatureEmoteIcon(painter, value, 64, 54, 22);
  let texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
