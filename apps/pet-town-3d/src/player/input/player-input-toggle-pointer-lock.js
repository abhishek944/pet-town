export function playerInputTogglePointerLock() {
  try {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    } else {
      this.canvas.requestPointerLock?.();
    }
  } catch {}
}
