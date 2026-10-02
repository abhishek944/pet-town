import { Vector3 } from "three";

export function createCompanionLabels(context, records, controller) {
  const root = document.createElement("div");
  root.className = "town-labels";
  document.body.append(root);
  const labels = new Map();
  const point = new Vector3();
  const direction = new Vector3();
  let visibilityTimer = 0;
  return {
    update(deltaTime) {
      root.hidden = !!(context.hud?.blocking || context.hud?.hidden || context.hud?.photoMode);
      visibilityTimer -= deltaTime;
      const refreshVisibility = visibilityTimer <= 0;
      if (refreshVisibility) visibilityTimer = 0.18;
      for (const [id, label] of labels)
        if (!records.has(id)) {
          label.remove();
          labels.delete(id);
        }
      for (const record of records.values()) {
        let label = labels.get(record.id);
        if (!label) {
          label = document.createElement("button");
          label.className = "town-label";
          label.onclick = (event) => {
            controller.select(record.id);
            if (event.detail > 0) label.blur();
          };
          labels.set(record.id, label);
          root.append(label);
        }
        label.textContent = record.label;
        label.title = `${record.label} · ${record.status} · Follow`;
        label.dataset.selected = String(controller.selected === record);
        point.copy(record.head);
        point.y += 0.55;
        if (refreshVisibility) {
          direction.copy(point).sub(context.camera.position);
          const distance = direction.length();
          direction.normalize();
          const hit = context.terrain.raycast(context.camera.position, direction, distance);
          label.dataset.occluded = String(!!hit && hit.distance < distance - 0.4);
        }
        point.project(context.camera);
        label.hidden =
          !record.root.visible ||
          point.z > 1 ||
          point.z < -1 ||
          Math.abs(point.x) > 1.1 ||
          Math.abs(point.y) > 1.1 ||
          label.dataset.occluded === "true";
        if (!label.hidden)
          label.style.transform = `translate(${((point.x + 1) * (context.viewport?.width ?? innerWidth)) / 2}px,${((1 - point.y) * (context.viewport?.height ?? innerHeight)) / 2}px) translate(-50%,-100%)`;
      }
    },
    dispose() {
      root.remove();
      labels.clear();
    },
  };
}
