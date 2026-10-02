/** A terminal focus target owns keys; the world remains playable outside it. */
export function isGameInputCaptured(context, event) {
  return Boolean(
    context.petTown?.terminal?.inputActive || event?.target?.closest?.('[data-town-ui="terminal"]'),
  );
}
