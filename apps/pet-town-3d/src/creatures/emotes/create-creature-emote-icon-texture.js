/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
import * as THREE from "three";
import { drawCreatureEmoteIcon } from "./draw-creature-emote-icon.js";
export function createCreatureEmoteIconTexture(value) {
  let element = document.createElement(`canvas`);
  element.width = 64;
  element.height = 64;
  let painter = element.getContext(`2d`);
  painter.shadowColor = `rgba(255,255,255,0.95)`;
  painter.shadowBlur = 6;
  drawCreatureEmoteIcon(painter, value, 32, 32, 22);
  let texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
