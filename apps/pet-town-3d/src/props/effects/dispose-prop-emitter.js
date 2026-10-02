/** Cached effect textures, instanced billboards, decals, smoke, campfire particles and pooled lights. */
export function disposePropEmitter(meshValue) {
  meshValue.mesh?.removeFromParent();
  meshValue.mesh?.geometry.dispose();
  meshValue.mat?.dispose();
}
