/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
export let parsePlayerNumberList = (splitValue) =>
  splitValue
    ? splitValue
        .split(`,`)
        .map(Number)
        .filter((value) => !Number.isNaN(value))
    : null;
