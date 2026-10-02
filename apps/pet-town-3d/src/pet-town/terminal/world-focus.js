/** Release keyboard focus without consuming the world's pointer event. */
export function bindWorldFocus(root, clearFocus, signal) {
  window.addEventListener(
    "pointerdown",
    (event) => {
      if (!event.composedPath().includes(root)) clearFocus();
    },
    { capture: true, signal },
  );
}
