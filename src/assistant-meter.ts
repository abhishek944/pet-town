export function startSpeechMeter(
  stream: MediaStream,
  onChange: (speaking: boolean) => void,
): () => void {
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  context.createMediaStreamSource(stream).connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  let speaking = false;
  let quietFrames = 0;
  const tick = () => {
    analyser.getFloatTimeDomainData(samples);
    const mean = samples.reduce((sum, value) => sum + value * value, 0) / samples.length;
    const loud = Math.sqrt(mean) > 0.025;
    quietFrames = loud ? 0 : quietFrames + 1;
    const next = loud || (speaking && quietFrames < 6);
    if (next !== speaking) {
      speaking = next;
      onChange(next);
    }
  };
  tick();
  const timer = window.setInterval(tick, 50);
  return () => {
    clearInterval(timer);
    void context.close();
  };
}
