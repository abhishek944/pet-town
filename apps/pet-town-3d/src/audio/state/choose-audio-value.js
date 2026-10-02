/** Audio settings, note scale, randomness and persisted sound preferences. */
export let chooseAudioValue = (values) => values[(Math.random() * values.length) | 0];
