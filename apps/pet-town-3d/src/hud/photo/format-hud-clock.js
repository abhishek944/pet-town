/** Clock formatting and photo capture, download and preview effects. */
export let formatHudClock = (hours) => {
  let result = Math.floor(hours);
  let result2 = Math.floor((hours - result) * 60);
  let result3 = result < 12 ? `AM` : `PM`;
  result = result % 12 || 12;
  return [`${result}:${String(result2).padStart(2, `0`)}`, result3];
};
