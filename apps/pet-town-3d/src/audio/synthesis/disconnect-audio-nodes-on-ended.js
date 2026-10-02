/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
export function disconnectAudioNodesOnEnded(source, ...nodes) {
  source.onended = () => {
    source.disconnect();
    for (let result of nodes) {
      result.disconnect();
      result._p?.disconnect();
    }
  };
}
