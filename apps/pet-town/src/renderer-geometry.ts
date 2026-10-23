/** Image readiness queues layout on its owner's existing frame; explicit render/input can flush now. */
export function createGeometryUpdates(update: () => void) {
  let pending = false;
  const flush = (): void => {
    pending = false;
    update();
  };
  return {
    request: (): void => {
      pending = true;
    },
    flush,
    flushPending: (): void => {
      if (pending) flush();
    },
  };
}
