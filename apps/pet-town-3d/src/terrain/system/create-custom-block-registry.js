/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */

import { terrainState } from "../state.js";
import { queueTerrainTextureLayer } from "../textures/atlas/queue-terrain-texture-layer.js";
export function createCustomBlockRegistry(state) {
  return function (definition = {}) {
    if (definition.transparent) {
      return;
    }
    let key = String(definition.key ?? definition.name ?? ``);
    if (!key) {
      return;
    }
    if (state.customBlockIds.has(key)) {
      return state.customBlockIds.get(key);
    }
    let blockId = terrainState.terrainBlockDefinitions.length;
    if (blockId > 250) {
      return;
    }
    let textures = definition.textures || {};
    let textureLayers = new Map();
    let queueTexture = (image, emissive) => {
      if (!image) {
        return null;
      }
      if (textureLayers.has(image)) {
        return textureLayers.get(image);
      }
      let layerId = queueTerrainTextureLayer(state.atlas, image, {
        bump: 0.8,
        emit: (emissive && Number(definition.emissive)) || 0,
      });
      textureLayers.set(image, layerId);
      return layerId;
    };
    let sideLayer = queueTexture(textures.side, true);
    let topLayer = queueTexture(textures.top, false) ?? sideLayer;
    let bottomLayer = queueTexture(textures.bottom, false) ?? sideLayer;
    if (sideLayer == null && topLayer == null) {
      return;
    }
    let color = definition.colors?.side ?? definition.colors?.top;
    terrainState.terrainBlockDefinitions[blockId] = {
      id: blockId,
      key: key,
      name: definition.name ?? key,
      top: topLayer ?? sideLayer,
      side: sideLayer ?? topLayer,
      bottom: bottomLayer ?? sideLayer ?? topLayer,
      tint: `custom`,
      color: color ? parseInt(String(color).replace(`#`, ``), 16) : 13421772,
      emissive: Number(definition.emissive) || 0,
    };
    state.atlasDirty = true;
    state.customBlockIds.set(key, blockId);
    return blockId;
  };
}
