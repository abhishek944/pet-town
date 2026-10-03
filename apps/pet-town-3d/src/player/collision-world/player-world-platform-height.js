import { playerPropFootprint } from "./player-prop-footprint.js";
import { playerState } from "../state.js";
export function playerWorldPlatformHeight(x, z, maxHeight) {
  let result = -1 / 0;
  for (const collider of this.colliders) {
    const top = collider.y1 ?? collider.maxY;
    if (
      !collider.noTop &&
      top <= maxHeight &&
      top > result &&
      playerPropFootprint(collider, x, z, playerState.playerMovementSettings.halfW)
    ) {
      result = top;
    }
  }
  let list2 = this.ctx.props?.list;
  if (Array.isArray(list2)) {
    for (let index = 0; index < list2.length; index++) {
      let result2 = list2[index];
      if (!result2) {
        continue;
      }
      const roof = result2.roofHeight?.(x, z, maxHeight);
      if (roof <= maxHeight && roof > result) result = roof;
      let result3 = Array.isArray(result2.decks)
        ? result2.decks
        : result2.deck && typeof result2.deck.heightAt != `function`
          ? [result2.deck]
          : null;
      if (result3) {
        for (let position of result3) {
          if (
            !position ||
            !isFinite(position.x) ||
            !isFinite(position.z) ||
            !isFinite(position.y)
          ) {
            continue;
          }
          let result10 = Math.cos(-(position.rot ?? 0));
          let result11 = Math.sin(-(position.rot ?? 0));
          let result12 = x - position.x;
          let result13 = z - position.z;
          let result14 = result12 * result10 - result13 * result11;
          let result15 = result12 * result11 + result13 * result10;
          if (
            Math.abs(result14) <= (position.w ?? 1) / 2 &&
            Math.abs(result15) <= (position.d ?? 1) / 2 &&
            position.y <= maxHeight &&
            position.y > result
          ) {
            result = position.y;
          }
        }
      }
      let deck2 = result2.deck;
      if (!deck2 || typeof deck2.heightAt != `function`) {
        continue;
      }
      let result4 = deck2.bx - deck2.ax;
      let result5 = deck2.bz - deck2.az;
      let result6 = result4 * result4 + result5 * result5;
      if (!(result6 > 0)) {
        continue;
      }
      let result7 = ((x - deck2.ax) * result4 + (z - deck2.az) * result5) / result6;
      if (result7 < -0.02 || result7 > 1.02) {
        continue;
      }
      let result8 = Math.sqrt(result6);
      if (
        Math.abs((x - deck2.ax) * result5 - (z - deck2.az) * result4) / result8 >
        (deck2.width ?? 1.8) / 2
      ) {
        continue;
      }
      let result9;
      try {
        result9 = deck2.heightAt(Math.min(1, Math.max(0, result7)));
      } catch {
        continue;
      }
      if (
        typeof result9 == `number` &&
        isFinite(result9) &&
        result9 <= maxHeight &&
        result9 > result
      ) {
        result = result9;
      }
    }
  }
  let walkSurfaces2 = this.ctx.walkSurfaces;
  if (Array.isArray(walkSurfaces2)) {
    for (let result16 of walkSurfaces2) {
      let result17;
      try {
        result17 = result16(x, z);
      } catch {
        continue;
      }
      if (
        typeof result17 == `number` &&
        isFinite(result17) &&
        result17 <= maxHeight &&
        result17 > result
      ) {
        result = result17;
      }
    }
  }
  return result;
}
