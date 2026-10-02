/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { initializeProps } from "./initialize-props.js";
import { updateProps } from "./update-props.js";
import { distanceToPropColliderSegment } from "./distance-to-prop-collider-segment.js";
import { samplePropWalkHeight } from "./sample-prop-walk-height.js";
import { rebuildProps } from "./rebuild-props.js";
import { reseatAllProps } from "./reseat-all-props.js";
export function preparePropsSystem() {
  propsState.propsSystem = {
    get init() {
      return initializeProps;
    },
    get update() {
      return updateProps;
    },
  };
  propsState.propsRuntime = {
    ctx: null,
    group: null,
    mats: null,
    statics: [],
    smokes: [],
    fires: [],
    blades: [],
    halos: [],
    pool: null,
    batches: null,
    fireLight: null,
    walk: [],
    recs: new Map(),
    layout: null,
    rebuildIn: -1,
    dirty: new Set(),
    dirtyIn: -1,
    pollT: 0,
    night: 0,
    t: 0,
    debug: null,
    pools: [],
    shade: [],
  };
  propsState.propColliders = [];
  propsState.propEntries = [];
  propsState.propVegetationClearings = [];
  propsState.propsFallbackCameraPosition = new THREE.Vector3();
  propsState.propsApi = {
    colliders: propsState.propColliders,
    list: propsState.propEntries,
    clearings: propsState.propVegetationClearings,
    plaza: null,
    night: 0,
    get walk() {
      return propsState.propsRuntime.walk;
    },
    get group() {
      return propsState.propsRuntime.group;
    },
    nearest(position, value, value2 = 1 / 0) {
      if (!position) {
        return null;
      }
      let result =
        typeof value == `string`
          ? (typeValue) => typeValue.type === value
          : typeof value == `function`
            ? value
            : null;
      let result2 = null;
      let value2Value = value2;
      for (let position2 of propsState.propEntries) {
        if (result && !result(position2)) {
          continue;
        }
        let result3 =
          Math.hypot(position2.x - position.x, position2.z - position.z) -
          (position2.radius ?? 0) * 0.5;
        if (result3 < value2Value) {
          value2Value = result3;
          result2 = position2;
        }
      }
      return result2;
    },
    isBlocked(value, value2, value3 = 0) {
      return propsState.propColliders.some((position) =>
        position.kind === `segment`
          ? distanceToPropColliderSegment(value, value2, position) < position.r + value3
          : position.hx == null
            ? Math.hypot(position.x - value, position.z - value2) < position.radius + value3
            : Math.abs(value - position.x) < position.hx + value3 &&
              Math.abs(value2 - position.z) < position.hz + value3,
      );
    },
    walkHeight: (value, value2) => samplePropWalkHeight(value, value2),
    rebuild(value = true) {
      if (value) {
        rebuildProps(true);
      } else {
        reseatAllProps();
      }
    },
  };
}
