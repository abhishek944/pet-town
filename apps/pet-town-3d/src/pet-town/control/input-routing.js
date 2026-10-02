/** Route the game's existing keyboard, touch and gamepad sample to one avatar. */
export function routeTownInput(context, getSelected) {
  const input = context.player.input;
  const originalPoll = input.poll;
  let sample = {};
  let focused = document.hasFocus() && !document.hidden;
  const listeners = new AbortController();
  const refreshFocus = () => {
    focused = document.hasFocus() && !document.hidden;
  };
  window.addEventListener("focus", refreshFocus, { signal: listeners.signal });
  window.addEventListener(
    "blur",
    () => {
      focused = false;
      sample = {};
    },
    { signal: listeners.signal },
  );
  document.addEventListener("visibilitychange", refreshFocus, { signal: listeners.signal });
  function clear() {
    sample = {};
    input.held.clear();
    input.pressed.clear();
    input.drag = null;
    input.touches?.clear();
    input.pinch = 0;
    for (const key of Object.keys(context.keys)) context.keys[key] = false;
    const record = getSelected();
    if (record)
      Object.assign(record.input, {
        mx: 0,
        mz: 0,
        run: false,
        jumpHeld: false,
        jumpPressed: false,
      });
    input.orbitX = input.orbitY = input.zoom = 0;
  }
  for (const type of ["focusin", "focusout"])
    document.addEventListener(
      type,
      (event) => {
        if (event.target?.closest?.('[data-town-ui="terminal"]')) clear();
      },
      { signal: listeners.signal },
    );
  input.poll = function (deltaTime) {
    const controls = originalPoll.call(this, deltaTime);
    const pickerOpen = context.petTown?.panel?.open;
    const captured = context.petTown?.terminal?.inputActive;
    sample =
      pickerOpen || captured || !focused || context.hud?.blocking || context.paused ? {} : controls;
    if (!getSelected() && !pickerOpen && !captured) return controls;
    return {
      ...controls,
      x: 0,
      y: 0,
      run: false,
      jumpHeld: false,
      jumpPressed: false,
      orbitX: 0,
      orbitY: 0,
      zoom: 0,
      rotate: 0,
    };
  };
  return {
    get sample() {
      return sample;
    },
    clear,
    dispose() {
      listeners.abort();
      input.poll = originalPoll;
    },
  };
}
