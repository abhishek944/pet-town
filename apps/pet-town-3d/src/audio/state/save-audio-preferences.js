/** Audio settings, note scale, randomness and persisted sound preferences. */
import { audioState } from "../state.js";
export let saveAudioPreferences = () => {
  try {
    localStorage.setItem(
      `pk-audio`,
      JSON.stringify({
        volume: audioState.audioRuntime.volume,
        muted: audioState.audioRuntime.muted,
      }),
    );
  } catch {}
};
