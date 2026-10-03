import { createAssetModel } from "../props/collection/model.js";

export function createAssetGhost(context) {
  let model;
  let selected;
  function clear() {
    if (!model) return;
    model.removeFromParent();
    model.traverse((mesh) => {
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    model = null;
  }
  return {
    show(id, position, valid) {
      if (selected !== id || !model) {
        clear();
        selected = id;
        model = createAssetModel(id);
        model.traverse((mesh) => {
          if (!mesh.isMesh) return;
          mesh.material = mesh.material.clone();
          mesh.material.transparent = true;
          mesh.material.opacity = 0.36;
          mesh.material.depthWrite = false;
          mesh.castShadow = false;
        });
        context.scene.add(model);
      }
      model.position.set(position.x, position.y ?? 0, position.z);
      model.rotation.y = position.rot;
      model.traverse((mesh) => {
        if (mesh.isMesh) mesh.material.color.setHex(valid ? 0xd8f2da : 0xe8aaa0);
      });
      model.visible = true;
    },
    hide() {
      if (model) model.visible = false;
    },
    dispose: clear,
  };
}
