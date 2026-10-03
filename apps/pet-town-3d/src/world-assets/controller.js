import { getAssetBaseLayout } from "./base-layout.js";
import * as THREE from "three";
import { getWorldAsset, WORLD_ASSETS } from "../props/collection/catalog.js";
import { getWorldAssetStore } from "./storage.js";
import { createAssetGhost } from "./ghost.js";
import { validateAssetPlacement, assetWorldReady } from "./validate-placement.js";

export function createWorldAssetController(context) {
  const store = getWorldAssetStore();
  const ghost = createAssetGhost(context);
  let active = false;
  let position;
  let origin;
  let direction;
  let lastUpdate = -Infinity;
  const state = {
    selectedId: WORLD_ASSETS[0].id,
    distance: 12,
    rotation: 0,
    targetKey: null,
    error: store.error,
    placementValid: false,
    placementNote: "",
    targets: [],
    canUndo: false,
    canRestore: false,
  };
  function update(force = false) {
    if (!active) return;
    const now = performance.now();
    if (!force && now - lastUpdate < 200) return;
    lastUpdate = now;
    const asset = getWorldAsset(state.selectedId);
    state.targets = context.props.list
      .filter(
        (entry) =>
          ["cottage", "bench", "lamp", "mailbox", "asset"].includes(entry.type) &&
          entry.placementKey &&
          Math.hypot(entry.x - origin.x, entry.z - origin.z) <= 25,
      )
      .map((entry) => ({
        key: entry.placementKey,
        name: `${entry.name} · ${Math.round(Math.hypot(entry.x - origin.x, entry.z - origin.z))}m · (${Math.round(entry.x)}, ${Math.round(entry.z)})`,
      }));
    const target =
      state.targetKey && context.props.list.find((entry) => entry.placementKey === state.targetKey);
    if (state.targetKey && !target) state.targetKey = null;
    position = target
      ? { x: target.x, z: target.z, rot: state.rotation }
      : {
          x: Math.round(origin.x + direction.x * state.distance),
          z: Math.round(origin.z + direction.z * state.distance),
          rot: state.rotation,
        };
    const result = validateAssetPlacement(context, asset, position, state.targetKey);
    state.placementValid = result.valid && store.available;
    state.placementNote = store.error || result.note;
    state.canUndo = store.canUndo;
    state.canRestore =
      store.available && store.state.replacements.some((edit) => edit.key === state.targetKey);
    if (assetWorldReady(context))
      ghost.show(
        asset.id,
        { ...position, y: result.y ?? context.terrain.heightAt(position.x, position.z) },
        result.valid,
      );
  }
  function apply(replace) {
    update(true);
    if (!active || !state.placementValid || Boolean(state.targetKey) !== replace) return false;
    const previous = { ...store.state, base: store.state.base ?? getAssetBaseLayout(context) };
    const edit = { assetId: state.selectedId, x: position.x, z: position.z, rot: position.rot };
    let next;
    if (!replace) {
      next = {
        ...previous,
        additions: [...previous.additions, { ...edit, id: crypto.randomUUID() }],
      };
    } else if (state.targetKey.startsWith("added:")) {
      const id = state.targetKey.slice(6);
      next = {
        ...previous,
        additions: previous.additions.map((item) => (item.id === id ? { ...edit, id } : item)),
      };
    } else {
      next = {
        ...previous,
        replacements: [
          ...previous.replacements.filter((item) => item.key !== state.targetKey),
          { ...edit, key: state.targetKey },
        ],
      };
    }
    if (!store.save(next)) {
      state.error = store.error;
      return false;
    }
    context.props.rebuild(true);
    context.vegetation?.rebuild();
    state.error = "";
    context.hud?.toast(
      `${getWorldAsset(state.selectedId).name} ${replace ? "replaced" : "placed"}.`,
    );
    state.targetKey = null;
    ghost.hide();
    update(true);
    return true;
  }
  return {
    get state() {
      return state;
    },
    select(id) {
      if (getWorldAsset(id)) state.selectedId = id;
      state.error = store.error;
      update(true);
    },
    setDistance(value) {
      state.distance = Math.max(5, Math.min(24, Number(value) || 12));
      update(true);
    },
    rotate() {
      state.rotation = (state.rotation + Math.PI / 2) % (Math.PI * 2);
      update(true);
    },
    setTarget(key) {
      state.targetKey = key || null;
      const entry = context.props.list.find((item) => item.placementKey === key);
      if (entry) state.rotation = Math.round(entry.rot / (Math.PI / 2)) * (Math.PI / 2);
      update(true);
    },
    add: () => apply(false),
    replace: () => apply(true),
    restore() {
      if (!active || !assetWorldReady(context) || !state.canRestore) return false;
      if (
        !store.save({
          ...store.state,
          replacements: store.state.replacements.filter((edit) => edit.key !== state.targetKey),
        })
      ) {
        state.error = store.error;
        return false;
      }
      context.props.rebuild(true);
      context.vegetation?.rebuild();
      state.targetKey = null;
      state.error = "";
      update(true);
      return true;
    },
    undo() {
      if (!active || !assetWorldReady(context) || !store.undo()) {
        state.error = store.error;
        return false;
      }
      context.props.rebuild(true);
      context.vegetation?.rebuild();
      state.targetKey = null;
      state.error = "";
      update(true);
      return true;
    },
    setActive(value) {
      active = value;
      if (value) {
        origin = { x: context.player.position.x, z: context.player.position.z };
        direction = context.camera.getWorldDirection(new THREE.Vector3());
        direction.y = 0;
        if (direction.lengthSq() < 0.001) direction.set(0, 0, -1);
        direction.normalize();
        update(true);
      } else ghost.hide();
    },
    update,
    dispose() {
      active = false;
      ghost.dispose();
    },
  };
}
