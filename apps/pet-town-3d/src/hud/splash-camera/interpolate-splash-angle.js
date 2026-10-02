/** Obstacle-aware opening camera orbit and transition back to gameplay. */
export let interpolateSplashAngle = (from, to, amount) =>
  from +
  (((((to - from + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI) * amount;
