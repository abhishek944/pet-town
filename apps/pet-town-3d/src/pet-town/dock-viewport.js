import "./dock-viewport.css";

/** Reserve dock space without changing the renderer's public-build extension boundary. */
export function createDockViewport(context) {
  let visible = false;
  const root = document.documentElement;
  const listeners = new AbortController();
  function resize() {
    const width = visible ? Math.min(560, Math.floor(innerWidth / 2)) : 0;
    root.style.setProperty("--town-dock-width", `${width}px`);
    root.style.setProperty("--town-world-width", `${Math.max(1, innerWidth - width)}px`);
    root.classList.toggle("town-dock-open", visible);
    context.resizeViewport(width);
  }
  window.addEventListener("resize", resize, { signal: listeners.signal });
  return {
    setVisible(value) {
      if (visible === value) return;
      visible = value;
      context.petTown?.controller.clearInput();
      resize();
    },
    dispose() {
      listeners.abort();
      visible = false;
      resize();
      root.style.removeProperty("--town-dock-width");
      root.style.removeProperty("--town-world-width");
    },
  };
}
