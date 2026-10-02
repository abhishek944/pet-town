/** HUD context, state, DOM helpers, clock colors and weather display values. */
export let interpolateHudHexColors = (from, to, amount) => {
  let parseIntResult = parseInt(from.slice(1), 16);
  let parseIntResult2 = parseInt(to.slice(1), 16);
  let callback = (value2) =>
    Math.round(
      ((parseIntResult >> value2) & 255) * (1 - amount) +
        ((parseIntResult2 >> value2) & 255) * amount,
    );
  return `rgb(${callback(16)},${callback(8)},${callback(0)})`;
};
