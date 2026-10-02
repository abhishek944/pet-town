/** Procedural pentatonic music, chord progressions, motif variation and scheduling. */
import { beginMusicPhrase } from "./begin-music-phrase.js";
import { audioState } from "../state.js";
import { randomAudioRange } from "../state/random-audio-range.js";
import { playMusicPadChord } from "../synthesis/play-music-pad-chord.js";
import { playMalletNote } from "../synthesis/play-mallet-note.js";
import { playBellNote } from "../synthesis/play-bell-note.js";
import { pentatonicDegreeToMidi } from "./pentatonic-degree-to-midi.js";
export function scheduleMusicStep(step, startTime, nightAmount) {
  let result = step % 16;
  let result2 = Math.floor(step / 16) % 4;
  if (step % 64 == 0) {
    beginMusicPhrase(nightAmount);
  }
  let values = audioState.musicChordVoicings[audioState.musicSequencerState.prog[result2]].map(
    (value4) => value4 + audioState.musicSequencerState.key,
  );
  let callback = () => randomAudioRange(-0.006, 0.01);
  if (result === 0) {
    playMusicPadChord(
      startTime,
      values.slice(0, 3).map((value5) => value5 + 60),
      (60 / audioState.musicSequencerState.bpm) * 8 - 0.2,
      0.018 * (1 - nightAmount * 0.3),
    );
  }
  if (result % 8 == 0) {
    playMalletNote(startTime + callback(), values[0] + 48, 0.13, -0.1);
  }
  if (result % 8 == 4 && Math.random() < 0.7) {
    playMalletNote(startTime + callback(), values[2] + 48, 0.085, -0.1);
  }
  let result3 = (result % 2 ? 0.22 : 0.45) * (1 - nightAmount * 0.5);
  if (Math.random() < result3) {
    playMalletNote(
      startTime + callback(),
      values[(result >> 1) % values.length] + 60 + (Math.random() < 0.2 ? 12 : 0),
      randomAudioRange(0.04, 0.065),
      randomAudioRange(-0.4, 0.4),
    );
  }
  let result4 = audioState.musicSequencerState.motifs[result2];
  if (result4) {
    for (let result5 of result4) {
      if (result5.s === result) {
        playBellNote(
          startTime + callback(),
          pentatonicDegreeToMidi(result5.idx, 72 + audioState.musicSequencerState.key) -
            (nightAmount > 0.6 ? 12 : 0),
          0.12 * result5.v * randomAudioRange(0.85, 1.1),
          randomAudioRange(-0.25, 0.25),
        );
      }
    }
  }
  if (Math.random() < 0.012 * (1 - nightAmount * 0.5)) {
    playBellNote(
      startTime + 0.09,
      pentatonicDegreeToMidi(
        12 + ((Math.random() * 3) | 0),
        72 + audioState.musicSequencerState.key,
      ),
      0.045,
      randomAudioRange(-0.7, 0.7),
    );
  }
}
