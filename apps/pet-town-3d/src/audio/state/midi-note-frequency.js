/** Audio settings, note scale, randomness and persisted sound preferences. */
export let midiNoteFrequency = (midiNote) => 440 * 2 ** ((midiNote - 69) / 12);
