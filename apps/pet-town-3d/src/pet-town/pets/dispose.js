export function disposePetResources(...roots) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  for (const root of roots) {
    root?.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of [object.material].flat()) if (material) materials.add(material);
    });
    root?.removeFromParent();
  }
  for (const material of materials) {
    for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
  }
  for (const resource of [...geometries, ...materials, ...textures]) resource.dispose();
}
