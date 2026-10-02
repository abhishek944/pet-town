import { playerState } from "../../player/state.js";

/** Isolate colors and visibility while retaining the original felt shader and day/night light. */
export function isolateCharacterMaterials(character) {
  const replacements = new Map();
  const visibility = { value: 1 };
  const clone = (original) => {
    if (replacements.has(original)) return replacements.get(original);
    const material = original.clone();
    // Constructor materials are private to this character. Preserve their typed shader uniforms.
    material.userData = original.userData;
    material.onBeforeCompile = (shader, renderer) => {
      original.onBeforeCompile.call(original, shader, renderer);
      if (shader.uniforms.uPipFade) shader.uniforms.uPipFade = visibility;
    };
    material.customProgramCacheKey = () => `${original.customProgramCacheKey()}|town-agent`;
    replacements.set(original, material);
    return material;
  };
  for (const key of Object.keys(character.M)) character.M[key] = clone(character.M[key]);
  for (const root of [character.root, character.shadow]) {
    root.traverse((object) => {
      if (object.material) {
        object.material = Array.isArray(object.material)
          ? object.material.map(clone)
          : clone(object.material);
      }
    });
  }
  const lightingMaterials = playerState.playerStylizedMaterials;
  for (let index = 0; index < lightingMaterials.length; index++) {
    lightingMaterials[index] =
      replacements.get(lightingMaterials[index]) ?? lightingMaterials[index];
  }
  for (const original of replacements.keys()) original.dispose();
  return visibility;
}

export function characterResourceDisposer(character) {
  const geometries = new Set();
  const materials = new Set(Object.values(character.M));
  const textures = new Set();
  const sharedGeometry = new Set(Object.values(playerState.playerGeometryCache));
  for (const root of [character.root, character.shadow]) {
    root.traverse((object) => {
      if (object.geometry && !sharedGeometry.has(object.geometry)) geometries.add(object.geometry);
      for (const material of [object.material].flat()) if (material) materials.add(material);
    });
  }
  for (const material of materials) {
    for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
  }
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    character.root.removeFromParent();
    character.shadow.removeFromParent();
    const lightingMaterials = playerState.playerStylizedMaterials;
    for (let index = lightingMaterials.length - 1; index >= 0; index--) {
      if (materials.has(lightingMaterials[index])) lightingMaterials.splice(index, 1);
    }
    for (const resource of [...geometries, ...materials, ...textures]) resource.dispose();
  };
}
