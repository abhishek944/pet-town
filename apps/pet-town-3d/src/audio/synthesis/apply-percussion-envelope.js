/** Noise/reverb generation, audio graph and reusable oscillator/envelope instruments. */
export function applyPercussionEnvelope(gainNode, startTime, peak, decay, attack = 0.003) {
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(peak, startTime + attack);
  gainNode.gain.setTargetAtTime(0, startTime + attack, decay);
  return startTime + attack + decay * 7;
}
