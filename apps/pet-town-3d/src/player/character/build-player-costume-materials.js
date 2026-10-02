/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { createPlayerStylizedMaterial } from "../materials/create-player-stylized-material.js";
import { playerState } from "../state.js";
import { createPlayerRadialGradientTexture } from "../geometry/create-player-radial-gradient-texture.js";
import { applyPlayerDitherFade } from "../materials/apply-player-dither-fade.js";
export function buildPlayerCostumeMaterials() {
  let materials = (this.M = {
    fur: createPlayerStylizedMaterial(playerState.playerPalette.fur, {
      rim: 0.32,
      felt: 0.06,
      feltN: 0.08,
    }),
    hood: createPlayerStylizedMaterial(16777215, {
      rim: 0.32,
      felt: 0.06,
      feltN: 0.08,
      vertexColors: true,
      key: `pipHood`,
    }),
    piping: createPlayerStylizedMaterial(playerState.playerPalette.piping, {
      rim: 0.3,
      felt: 0.08,
      feltN: 0.1,
      feltScale: 70,
    }),
    stitch: createPlayerStylizedMaterial(playerState.playerPalette.stitch, {
      rim: 0.1,
      felt: 0,
    }),
    belly: createPlayerStylizedMaterial(playerState.playerPalette.belly, {
      rim: 0.25,
      felt: 0.07,
      feltN: 0.08,
      lift: 0.1,
    }),
    bellyStitch: createPlayerStylizedMaterial(playerState.playerPalette.bellyStitch, {
      rim: 0.1,
      felt: 0,
    }),
    scarfV: createPlayerStylizedMaterial(16777215, {
      rim: 0.3,
      felt: 0.09,
      feltN: 0.12,
      feltScale: 60,
      vertexColors: true,
      key: `pipScarf`,
    }),
    acorn: createPlayerStylizedMaterial(16777215, {
      rough: 0.7,
      rim: 0.3,
      felt: 0.05,
      feltN: 0.15,
      feltScale: 80,
      vertexColors: true,
      key: `pipAcorn`,
    }),
    pad: createPlayerStylizedMaterial(playerState.playerPalette.pad, {
      rim: 0.15,
      lift: 0.12,
      felt: 0.03,
    }),
    furLight: createPlayerStylizedMaterial(playerState.playerPalette.furLight, {
      rim: 0.28,
      felt: 0.05,
      feltN: 0.06,
    }),
    cream: createPlayerStylizedMaterial(playerState.playerPalette.cream, {
      rim: 0.22,
      felt: 0.05,
      feltN: 0.06,
      lift: 0.1,
    }),
    skin: createPlayerStylizedMaterial(playerState.playerPalette.skin, {
      rough: 0.62,
      rim: 0.2,
      lift: 0.14,
      ramp: 0.35,
      felt: 0.015,
      feltN: 0,
      nightWarm: 0.42,
    }),
    hair: createPlayerStylizedMaterial(playerState.playerPalette.hair, {
      rough: 0.55,
      rim: 0.3,
      felt: 0.05,
      feltN: 0.12,
      feltScale: 70,
      nightWarm: 0.2,
    }),
    scarf: createPlayerStylizedMaterial(playerState.playerPalette.scarf, {
      rim: 0.3,
      felt: 0.09,
      feltN: 0.12,
      feltScale: 60,
    }),
    scarfTip: createPlayerStylizedMaterial(playerState.playerPalette.scarfTip, {
      felt: 0.1,
    }),
    boot: createPlayerStylizedMaterial(playerState.playerPalette.boot, {
      rough: 0.55,
      rim: 0.25,
      felt: 0.04,
      feltN: 0.08,
    }),
    sole: createPlayerStylizedMaterial(playerState.playerPalette.sole, {
      felt: 0.02,
    }),
    earIn: createPlayerStylizedMaterial(playerState.playerPalette.earIn, {
      rim: 0.12,
      lift: 0.14,
      felt: 0.05,
    }),
    leafG: createPlayerStylizedMaterial(playerState.playerPalette.leaf, {
      rough: 0.5,
      rim: 0.3,
      felt: 0.03,
      feltN: 0,
    }),
    bag: createPlayerStylizedMaterial(playerState.playerPalette.bag, {
      rim: 0.3,
      felt: 0.07,
      feltN: 0.1,
    }),
    bagFlap: createPlayerStylizedMaterial(playerState.playerPalette.bagFlap, {
      rim: 0.3,
      felt: 0.07,
      feltN: 0.1,
    }),
    strap: createPlayerStylizedMaterial(playerState.playerPalette.strap, {
      rough: 0.6,
      felt: 0.05,
    }),
    button: createPlayerStylizedMaterial(playerState.playerPalette.button, {
      rough: 0.35,
      rim: 0.4,
      lift: 0.15,
      felt: 0,
    }),
    leaf: createPlayerStylizedMaterial(16777215, {
      rough: 0.55,
      rim: 0.2,
      lift: 0.06,
      felt: 0.03,
      feltN: 0,
      side: 2,
      vertexColors: true,
    }),
    stem: createPlayerStylizedMaterial(playerState.playerPalette.stem, {
      felt: 0.03,
    }),
    mouth: new THREE.MeshStandardMaterial({
      color: playerState.playerPalette.mouth,
      roughness: 0.45,
    }),
    eye: new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.12,
      metalness: 0,
    }),
    white: new THREE.MeshBasicMaterial({
      color: playerState.playerPalette.white,
      toneMapped: false,
    }),
    ink: new THREE.MeshBasicMaterial({
      color: 3809832,
    }),
    tongue: new THREE.MeshStandardMaterial({
      color: 16744600,
      roughness: 0.5,
    }),
    blush: new THREE.MeshBasicMaterial({
      map: createPlayerRadialGradientTexture([
        [0, `rgba(255,255,255,0.95)`],
        [0.55, `rgba(255,255,255,0.6)`],
        [1, `rgba(255,255,255,0)`],
      ]),
      color: playerState.playerPalette.blush,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  });
  for (let result17 of [`mouth`, `eye`, `white`, `ink`, `tongue`]) {
    applyPlayerDitherFade(materials[result17]);
  }
  return {
    materials,
  };
}
