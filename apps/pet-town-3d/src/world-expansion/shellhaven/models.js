import * as THREE from "three";
import { createActivityModel } from "../willowmere/model-kit.js";
import { createShellModel } from "./shell-model.js";
import { COAST_SHELLS, DISPLAY_SHELF } from "./places.js";
import { shellSupport, displaySupport } from "./support.js";
import { expansionRestored, distanceToPlace } from "../activities/places.js";
import { createShelfCollider } from "./shelf-collider.js";

export function createShellhavenModels(context) {
  const model = createActivityModel(context, "Shellhaven shore hunt and collection shelf");
  const collider = createShelfCollider(context);
  const shore = COAST_SHELLS.map((shell) => {
    const root = new THREE.Group();
    root.add(createShellModel(model, shell));
    model.root.add(root);
    const sparkle = model.mesh(new THREE.OctahedronGeometry(0.065), 0xffe9ad, root, true);
    return { root, sparkle, shell };
  });
  const shelf = new THREE.Group();
  model.root.add(shelf);
  function box(w, h, d, color, x, y, z, solid = true) {
    const item = model.mesh(new THREE.BoxGeometry(w, h, d), color, shelf);
    if (solid) item.name = "props_wood";
    item.position.set(x, y, z);
  }
  box(3.2, 0.12, 1.1, 0xc59c71, 0, 1.03, 0);
  for (const x of [-1.4, 1.4]) {
    for (const z of [-0.4, 0.4]) box(0.12, 1, 0.12, 0x9a7657, x, 0.5, z);
  }
  for (const z of [-0.54, 0.54]) box(3.2, 0.1, 0.08, 0xb18961, 0, 1.1, z);
  const display = COAST_SHELLS.map((shell, index) => {
    const root = new THREE.Group();
    const visual = createShellModel(model, shell);
    visual.scale.setScalar(0.65);
    visual.position.y *= 0.65;
    root.add(visual);
    root.position.set(-1.25 + index * 0.5, 1.09, 0);
    shelf.add(root);
    box(0.34, 0.01, 0.13, shell.color, root.position.x, 1.1, 0.33, false);
    return { root, visual, shell };
  });
  const featured = model.mesh(new THREE.OctahedronGeometry(0.07), 0xffe4a0, shelf, true);
  return {
    update(state) {
      model.root.visible = Boolean(expansionRestored(context));
      const support = model.root.visible ? displaySupport(context) : null;
      collider.update(support);
      // Parent changes also invalidate camera inventories when hidden solids return.
      const parent = support !== null ? (context.props?.group ?? context.scene) : context.scene;
      if (model.root.parent !== parent) parent.add(model.root);
      if (!model.root.visible) return;
      shore.forEach(({ root, sparkle, shell }, index) => {
        const support = shellSupport(context, shell);
        root.visible = support !== null && !state.shells.includes(shell.id);
        if (support !== null) root.position.set(shell.x, support, shell.z);
        sparkle.visible = distanceToPlace(context.player.position, shell) < 26;
        sparkle.position.set(0, 0.8 + Math.sin(context.time * 1.7 + index) * 0.12, 0);
        sparkle.rotation.y = context.time * 0.65;
        sparkle.scale.setScalar(0.55 + (Math.sin(context.time * 2 + index) + 1) * 0.3);
      });
      shelf.visible = support !== null;
      if (support !== null) shelf.position.set(DISPLAY_SHELF.x, support, DISPLAY_SHELF.z);
      display.forEach(({ root, visual, shell }) => {
        root.visible = state.shells.includes(shell.id);
        visual.rotation.y = state.favorite === shell.id ? Math.sin(context.time * 0.7) * 0.08 : 0;
      });
      const favorite = display.find(({ shell }) => shell.id === state.favorite);
      featured.visible = Boolean(favorite && state.shells.includes(state.favorite));
      if (favorite) featured.position.set(favorite.root.position.x, 1.65, 0);
      featured.rotation.y = context.time * 0.6;
    },
    dispose() {
      collider.dispose();
      model.dispose();
    },
  };
}
