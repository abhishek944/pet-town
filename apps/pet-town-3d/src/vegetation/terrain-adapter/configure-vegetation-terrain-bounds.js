/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */

import { isFiniteTerrainValue } from "./is-finite-terrain-value.js";
import { sampleTerrainHeightSafely } from "./sample-terrain-height-safely.js";
export function configureVegetationTerrainBounds(adapter) {
  adapter.terrain = adapter.context.terrain || {};
  adapter.width = 96;
  adapter.depth = 96;
  if (isFiniteTerrainValue(adapter.terrain.size)) {
    adapter.width = adapter.depth = adapter.terrain.size;
  } else {
    if (adapter.terrain.size && isFiniteTerrainValue(adapter.terrain.size.x)) {
      adapter.width = adapter.terrain.size.x;
      adapter.depth = isFiniteTerrainValue(adapter.terrain.size.z)
        ? adapter.terrain.size.z
        : isFiniteTerrainValue(adapter.terrain.size.y)
          ? adapter.terrain.size.y
          : adapter.width;
    } else {
      if (isFiniteTerrainValue(adapter.terrain.SIZE)) {
        adapter.width = adapter.depth = adapter.terrain.SIZE;
      } else {
        if (isFiniteTerrainValue(adapter.terrain.width)) {
          adapter.width = adapter.terrain.width;
          adapter.depth = isFiniteTerrainValue(adapter.terrain.depth)
            ? adapter.terrain.depth
            : adapter.width;
        }
      }
    }
  }
  adapter.minX = -adapter.width / 2;
  adapter.minZ = -adapter.depth / 2;
  if (adapter.terrain.bounds && isFiniteTerrainValue(adapter.terrain.bounds.minX)) {
    adapter.minX = adapter.terrain.bounds.minX;
    adapter.minZ = adapter.terrain.bounds.minZ ?? adapter.minZ;
    adapter.width = (adapter.terrain.bounds.maxX ?? adapter.minX + adapter.width) - adapter.minX;
    adapter.depth = (adapter.terrain.bounds.maxZ ?? adapter.minZ + adapter.depth) - adapter.minZ;
  } else {
    if (
      adapter.terrain.bounds &&
      adapter.terrain.bounds.min &&
      isFiniteTerrainValue(adapter.terrain.bounds.min.x)
    ) {
      adapter.minX = adapter.terrain.bounds.min.x;
      adapter.minZ = adapter.terrain.bounds.min.z;
      adapter.width = adapter.terrain.bounds.max.x - adapter.minX;
      adapter.depth = adapter.terrain.bounds.max.z - adapter.minZ;
    }
  }
  adapter.topHeight =
    typeof adapter.terrain.topY == `function`
      ? (value, value2) => {
          let terrainHeightSafelyResult = sampleTerrainHeightSafely(
            adapter.terrain.topY,
            value,
            value2,
          );
          return isFiniteTerrainValue(terrainHeightSafelyResult)
            ? terrainHeightSafelyResult
            : typeof adapter.terrain.heightAt == `function`
              ? sampleTerrainHeightSafely(adapter.terrain.heightAt, value, value2)
              : NaN;
        }
      : typeof adapter.terrain.heightAt == `function`
        ? (value3, value4) => sampleTerrainHeightSafely(adapter.terrain.heightAt, value3, value4)
        : () => NaN;
  adapter.smoothHeight =
    typeof adapter.terrain.heightAt == `function`
      ? (value5, value6) => sampleTerrainHeightSafely(adapter.terrain.heightAt, value5, value6)
      : adapter.topHeight;
  if (!adapter.terrain.bounds && !isFiniteTerrainValue(adapter.terrain.originX)) {
    let index2 = 0;
    let index3 = 0;
    for (let index4 = 0; index4 < 24; index4++) {
      let result24 = ((index4 * 7919) % 97) / 97;
      let result25 = ((index4 * 104729) % 89) / 89;
      let result5Result = adapter.topHeight(
        -adapter.width / 2 + result24 * adapter.width * 0.45 + 0.5,
        -adapter.depth / 2 + result25 * adapter.depth * 0.45 + 0.5,
      );
      let result5Result2 = adapter.topHeight(
        adapter.width * 0.55 + result24 * adapter.width * 0.4,
        adapter.depth * 0.55 + result25 * adapter.depth * 0.4,
      );
      if (isFiniteTerrainValue(result5Result) && result5Result > 0) {
        index2++;
      }
      if (isFiniteTerrainValue(result5Result2) && result5Result2 > 0) {
        index3++;
      }
    }
    if (index2 === 0 && index3 > 6) {
      adapter.minX = 0;
      adapter.minZ = 0;
    }
  }
  adapter.columns = Math.max(1, Math.round(adapter.width));
  adapter.rows = Math.max(1, Math.round(adapter.depth));
}
