/** Procedural pentatonic music, chord progressions, motif variation and scheduling. */
import { audioState } from "../state.js";
export let pentatonicDegreeToMidi = (degree, baseNote) =>
  baseNote + 12 * Math.floor(degree / 5) + audioState.musicPentatonicScale[degree % 5] - 12;
