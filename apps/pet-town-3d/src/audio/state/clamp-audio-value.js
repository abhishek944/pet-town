/** Audio settings, note scale, randomness and persisted sound preferences. */
export let clampAudioValue = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));
