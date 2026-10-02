/** Color and lighting keyframes and interpolation across the day/night cycle. */
export let smoothSkyInterpolation = (value) => value * value * (3 - 2 * value);
