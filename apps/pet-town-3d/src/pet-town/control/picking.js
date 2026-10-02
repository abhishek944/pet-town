import { Raycaster, Vector2 } from "three";

export function bindTownPicking(context, records, select, originalInput) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const listeners = new AbortController();
  let press = null;
  let suppressMouseUntil = 0;
  function pick(event) {
    const rect = context.canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2,
    );
    raycaster.setFromCamera(pointer, context.camera);
    const roots = [...records.values()].filter((r) => r.root.visible).map((r) => r.root);
    const hit = raycaster.intersectObjects(roots, true)[0];
    if (!hit) return null;
    const terrain = context.terrain.raycast(
      raycaster.ray.origin,
      raycaster.ray.direction,
      hit.distance,
    );
    if (terrain && terrain.distance < hit.distance - 0.05) return null;
    return [...records.values()].find((record) => {
      for (let node = hit.object; node; node = node.parent) if (node === record.root) return true;
      return false;
    });
  }
  const on = (name, handler) =>
    window.addEventListener(name, handler, { capture: true, signal: listeners.signal });
  on("pointerdown", (event) => {
    if (event.target === context.canvas) context.petTown?.terminal?.blur();
    if (
      event.target !== context.canvas ||
      event.button !== 0 ||
      context.hud?.blocking ||
      context.petTown?.panel?.open
    )
      return;
    const record = pick(event);
    if (!record) return;
    press = { id: record.id, x: event.clientX, y: event.clientY, time: performance.now() };
    originalInput.drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: 0,
      button: 0,
    };
    event.stopImmediatePropagation();
  });
  on("pointerup", (event) => {
    if (!press) return;
    const clicked =
      Math.hypot(event.clientX - press.x, event.clientY - press.y) < 5 &&
      performance.now() - press.time < 500;
    if (clicked) select(press.id);
    press = null;
    originalInput.drag = null;
    suppressMouseUntil = performance.now() + 80;
    event.stopImmediatePropagation();
  });
  for (const name of ["mousedown", "mouseup"])
    on(name, (event) => {
      if (press || performance.now() < suppressMouseUntil) event.stopImmediatePropagation();
    });
  on("pointercancel", () => {
    press = null;
    originalInput.drag = null;
  });
  on("blur", () => {
    press = null;
  });
  return () => listeners.abort();
}
