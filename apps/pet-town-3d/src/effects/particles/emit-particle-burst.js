/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import * as THREE from "three";
import { effectsState } from "../state.js";
import { warnUnknownParticleKind } from "./warn-unknown-particle-kind.js";
import { copyParticlePosition } from "./copy-particle-position.js";
import { resolveParticleColor } from "./resolve-particle-color.js";
import { randomParticleRange } from "./random-particle-range.js";
import { chooseParticleValue } from "./choose-particle-value.js";
export function emitParticleBurst(position, kind = `sparkle`, options = {}) {
  if (!effectsState.particleEffectsState) {
    return 0;
  }
  let preset =
    effectsState.particlePresets[kind] ??
    (warnUnknownParticleKind(kind), effectsState.particlePresets.sparkle);
  let count = Math.max(0, Math.min(512, Math.round(options.count ?? preset.count)));
  let origin = copyParticlePosition(position, effectsState.particleEffectsState.tmp);
  let scale = options.scale ?? 1;
  let direction = options.dir
    ? copyParticlePosition(options.dir, effectsState.particleEffectsState.tmp2)
    : null;
  let colorOverride = resolveParticleColor(options.color, new THREE.Color());
  let colorChoices = options.colors?.map((candidateColor) => resolveParticleColor(candidateColor));
  let spread = (options.spread ?? preset.spread) * scale;
  let stagger = options.stagger ?? preset.stagger ?? 0;
  let {
    iPos: positionAttribute,
    iVel: velocityAttribute,
    iA: lifecycleAttribute,
    iB: physicsAttribute,
    iC: colorAttribute,
    iD: swayAttribute,
  } = effectsState.particleEffectsState.attrs;
  for (let index = 0; index < count; index++) {
    let particleIndex = effectsState.particleEffectsState.next;
    effectsState.particleEffectsState.next =
      (effectsState.particleEffectsState.next + 1) % effectsState.particlePoolCapacity;
    if (effectsState.particleEffectsState.next === 0) {
      effectsState.particleEffectsState.wrapped = true;
    }
    effectsState.particleEffectsState.dirtyMin = Math.min(
      effectsState.particleEffectsState.dirtyMin,
      particleIndex,
    );
    effectsState.particleEffectsState.dirtyMax = Math.max(
      effectsState.particleEffectsState.dirtyMax,
      particleIndex,
    );
    let offsetX = (Math.random() - 0.5) * 2 * spread;
    let offsetY = (Math.random() - 0.5) * spread;
    let offsetZ = (Math.random() - 0.5) * 2 * spread;
    let positions = positionAttribute.array;
    let vectorOffset = particleIndex * 3;
    let attributeOffset = particleIndex * 4;
    positions[vectorOffset] = origin.x + offsetX;
    positions[vectorOffset + 1] = origin.y + offsetY;
    positions[vectorOffset + 2] = origin.z + offsetZ;
    let speed =
      randomParticleRange(preset.speed[0], preset.speed[1]) * (options.speed ?? 1) * scale;
    let heading = Math.random() * Math.PI * 2;
    let velocityX = Math.cos(heading) * speed;
    let velocityZ = Math.sin(heading) * speed;
    let velocityY = randomParticleRange(preset.up[0], preset.up[1]) * (options.speed ?? 1) * scale;
    if (preset.dirX) {
      velocityX = (Math.random() < 0.5 ? -1 : 1) * preset.dirX * 0.3 + velocityX * 0.3;
    }
    if (direction) {
      velocityX += direction.x;
      velocityY += direction.y;
      velocityZ += direction.z;
    }
    let velocities = velocityAttribute.array;
    velocities[vectorOffset] = velocityX;
    velocities[vectorOffset + 1] = velocityY;
    velocities[vectorOffset + 2] = velocityZ;
    let lifetime = options.life ?? randomParticleRange(preset.life[0], preset.life[1]);
    let size = (options.size ?? randomParticleRange(preset.size[0], preset.size[1])) * scale;
    let sprite = chooseParticleValue(preset.sprite);
    let lifecycles = lifecycleAttribute.array;
    lifecycles[attributeOffset] =
      effectsState.particleEffectsState.time - (options.age ?? 0) + index * stagger;
    lifecycles[attributeOffset + 1] = lifetime;
    lifecycles[attributeOffset + 2] = size;
    lifecycles[attributeOffset + 3] = sprite;
    let spin = randomParticleRange(preset.spin[0], preset.spin[1]);
    let rotation =
      preset.rot == null ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * 2 * preset.rot;
    let physics = physicsAttribute.array;
    physics[attributeOffset] = options.gravity ?? preset.gravity;
    physics[attributeOffset + 1] = preset.drag;
    physics[attributeOffset + 2] = spin;
    physics[attributeOffset + 3] = rotation;
    let color = colorChoices
      ? chooseParticleValue(colorChoices)
      : (colorOverride ??
        effectsState.particleColorScratch.setRGB(...chooseParticleValue(preset.colors)));
    let alpha = options.alpha ?? preset.alpha;
    let colorIntensity =
      (preset.add > 0 ? alpha : 1) * (preset.add > 0 && (colorOverride || colorChoices) ? 2.2 : 1);
    let colors = colorAttribute.array;
    colors[attributeOffset] = color.r * colorIntensity;
    colors[attributeOffset + 1] = color.g * colorIntensity;
    colors[attributeOffset + 2] = color.b * colorIntensity;
    colors[attributeOffset + 3] = preset.add > 0 ? preset.add : alpha < 1 ? -alpha : 0;
    let flags =
      (preset.emis ?? 0) +
      (preset.blink ? 2 : 0) +
      (preset.pop ? 4 : 0) +
      (preset.twinkle ? 8 : 0) +
      (preset.flat ? 16 : 0) +
      (preset.glint ? 32 : 0);
    let sway = swayAttribute.array;
    sway[attributeOffset] = (preset.sway ?? 0) * scale;
    sway[attributeOffset + 1] = preset.swayF ?? 1;
    sway[attributeOffset + 2] = preset.sizeEnd ?? 1;
    sway[attributeOffset + 3] = flags;
  }
  return count;
}
