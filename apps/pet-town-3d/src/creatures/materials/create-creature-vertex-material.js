/** Shared creature materials, fur shading, emissive variants and day-night lighting. */
import * as THREE from "three";
export let createCreatureVertexMaterial = (value) =>
  new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0,
    ...value,
  });
