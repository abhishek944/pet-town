/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
export function updateVegetationPushers(frame) {
  frame.pushers = frame.uniforms.uPushers.value;
  frame.pusherCount = 0;
  frame.playerPosition = frame.context.player?.position || frame.context.player?.mesh?.position;
  frame.addPusher = (position4, value4) => {
    if (frame.pusherCount < 6 && position4 && Number.isFinite(position4.x)) {
      frame.pushers[frame.pusherCount++].set(position4.x, position4.y, position4.z, value4);
    }
  };
  frame.addPusher(frame.playerPosition, 1.3);
  for (let result8 of frame.api.pushers) {
    frame.addPusher(result8?.position ?? result8, result8?.radius ?? 0.9);
  }
  frame.creatures = Array.isArray(frame.context.creatures)
    ? frame.context.creatures
    : Array.isArray(frame.context.creatures?.list)
      ? frame.context.creatures.list
      : null;
  if (frame.creatures && frame.pusherCount < 6 && frame.playerPosition) {
    let values2 = [];
    for (let result9 of frame.creatures) {
      let position5 = result9?.position ?? result9?.mesh?.position ?? result9?.group?.position;
      if (position5 && Number.isFinite(position5.x)) {
        values2.push([
          position5,
          (position5.x - frame.playerPosition.x) ** 2 + (position5.z - frame.playerPosition.z) ** 2,
          result9.radius ?? 0.8,
        ]);
      }
    }
    values2.sort((value5, value6) => value5[1] - value6[1]);
    for (let [result10, , result11] of values2) {
      frame.addPusher(result10, Math.min(1.4, Math.max(0.5, result11)));
    }
  }
  for (let indexValue = frame.pusherCount; indexValue < 6; indexValue++) {
    frame.pushers[indexValue].w = 0;
  }
}
