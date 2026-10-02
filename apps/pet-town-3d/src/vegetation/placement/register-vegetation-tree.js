/** Vegetation clearings, flower palettes and biome-aware world population. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { scaleGeometryAroundCenter } from "../tree-geometry/scale-geometry-around-center.js";
export function registerVegetationTree(
  world,
  {
    cell,
    x,
    z,
    groundY,
    kind,
    minimumSpacing,
    isMeadow,
    variantIndex,
    geometry,
    scale,
    heightScale,
    rotation,
    baseY,
    tint,
  },
) {
  let parts = [
    world.fields[`${kind}${variantIndex}_trunk`].add(
      x,
      baseY,
      z,
      rotation,
      scale,
      heightScale,
      scale,
      null,
    ),
    world.fields[`${kind}${variantIndex}_canopy`].add(
      x,
      baseY,
      z,
      rotation,
      scale,
      heightScale,
      scale,
      tint,
    ),
  ];
  if (world.fields[`${kind}${variantIndex}_fringe`]) {
    parts.push(
      world.fields[`${kind}${variantIndex}_fringe`].add(
        x,
        baseY,
        z,
        rotation,
        scale,
        heightScale,
        scale,
        tint,
      ),
    );
  }
  let ledgeDistance = world.distanceToLedge(cell, 3);
  let shadowRadius = Math.min(geometry.canopyRadius * scale * 1.05, ledgeDistance);
  if (shadowRadius >= 0.9) {
    parts.push(
      world.fields.blob.add(
        x,
        groundY + 0.015,
        z,
        rotation,
        shadowRadius * 2,
        1,
        shadowRadius * 2,
        null,
      ),
    );
  }
  parts[0].proxyGeos = [
    geometry.trunkLite || geometry.trunk,
    geometry.canopyLod2 || geometry.canopyLod || geometry.canopy,
  ];
  parts[0].shadowGeos = [
    geometry.trunkLite || geometry.trunk,
    geometry.canopyShadow ||
      (geometry.canopyCenter
        ? scaleGeometryAroundCenter(
            geometry.canopyLod2 || geometry.canopy,
            geometry.canopyCenter,
            0.93,
          )
        : geometry.canopy),
  ];
  parts[1].tint = tint;
  let treeRecord = {
    position: new THREE.Vector3(x, baseY, z),
    x: x,
    y: baseY,
    z: z,
    radius: geometry.trunkRadius * scale,
    r: geometry.trunkRadius * scale,
    canopyRadius: geometry.canopyRadius * scale,
    height: geometry.height * heightScale,
    h: geometry.height * heightScale,
    type: kind,
    minD: minimumSpacing * 0.8,
    parts: parts,
    cell: cell,
  };
  let cosRotation = Math.cos(rotation);
  let sinRotation = Math.sin(rotation);
  if (
    ((treeRecord.canopies = (geometry.spheres || []).map((position2) => ({
      x: x + (position2.x * cosRotation + position2.z * sinRotation) * scale,
      y: baseY + position2.y * heightScale,
      z: z + (-position2.x * sinRotation + position2.z * cosRotation) * scale,
      r: position2.r * scale,
      tree: treeRecord,
    }))),
    geometry.skirt)
  ) {
    let skirt = geometry.skirt;
    treeRecord.skirt = {
      x: x,
      z: z,
      y: baseY + skirt.y0 * heightScale,
      y0: baseY + skirt.y0 * heightScale,
      h: (skirt.y1 - skirt.y0) * heightScale,
      radius: Math.min(1, Math.max(0.6, skirt.r * scale * 0.6)),
      kind: `pineSkirt`,
      owner: treeRecord,
    };
    treeRecord.skirt.r = treeRecord.skirt.radius;
  }
  for (let part of parts) {
    world.register(part, x, z);
    part.owner = treeRecord;
  }
  vegetationState.vegetationRuntimeState.trees.push(treeRecord);
  vegetationState.vegetationRuntimeState.colliders.push(treeRecord);
  if (treeRecord.skirt) {
    vegetationState.vegetationRuntimeState.colliders.push(treeRecord.skirt);
  }
  if (isMeadow) {
    world.meadowTreeCount++;
  }
  if (!world.treeGrid.has(world.treeGridKey(x, z))) {
    world.treeGrid.set(world.treeGridKey(x, z), []);
  }
  world.treeGrid.get(world.treeGridKey(x, z)).push(treeRecord);
  world.occupied[cell] |= 1;
  for (let [neighborX, neighborZ] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    let neighbor = world.neighborCell(cell, neighborX, neighborZ);
    if (neighbor >= 0) {
      world.occupied[neighbor] |= 16;
    }
  }
}
