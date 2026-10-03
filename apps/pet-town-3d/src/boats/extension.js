import * as THREE from "three";
import { createHarborLaunch } from "./model.js";
import { disposeBoatModel } from "./model-kit.js";
import { BOAT_HOME, createHarborDock } from "./dock.js";
import { boatDeckHeight } from "./coordinates.js";
import { createBoatCollisions } from "./collisions.js";
import { createBoatSolidBoxes } from "./solid-boxes.js";
import { boatPoseClear, advanceBoat } from "./navigation.js";
import { createBoatPassengers } from "./passengers.js";
import { createBoatInput } from "./input.js";
import { createBoatUi } from "./ui.js";
import { createBoatStorage } from "./storage.js";

export function createBoatsExtension() {
  let runtime;
  let disposed = false;
  return {
    id: "boats",
    init(context) {
      if (!context.terrain.ocean || context.params.has("waterTest")) return;
      const group = new THREE.Group();
      group.name = "harbor-boats";
      const model = createHarborLaunch();
      const dock = createHarborDock(context);
      const pose = { ...BOAT_HOME, y: context.water.sample(BOAT_HOME.x, BOAT_HOME.z) + 0.15 };
      const boat = { model, pose, speed: 0, active: false };
      const edges = createBoatCollisions(),
        boxes = createBoatSolidBoxes();
      const own = new Set([...edges.colliders, ...boxes.colliders]);
      const added = [...own, ...dock.colliders];
      edges.update(pose);
      boxes.update(pose);
      for (const collider of own) collider.boatInactive = true;
      context.colliders ??= [];
      context.colliders.push(...added);
      context.walkSurfaces ??= [];
      const deck = (x, z) => (boat.active ? boatDeckHeight(pose, x, z) : -Infinity);
      const dockSurface = (x, z) => dock.heightAt(x, z);
      context.walkSurfaces.push(deck, dockSurface);
      group.add(model, dock.model);
      context.scene.add(group);
      const passengers = createBoatPassengers(context, boat, dock);
      const input = createBoatInput(context, passengers);
      const ui = createBoatUi(context, passengers, input);
      const storage = createBoatStorage((message) => context.hud?.toast(message));
      const listeners = new AbortController();
      const save = () => storage.save(pose);
      window.addEventListener("pagehide", save, { signal: listeners.signal });
      window.addEventListener("blur", save, { signal: listeners.signal });
      context.boats = {
        get hasAction() {
          return !input.blocked() && !!passengers.action();
        },
        place: {
          id: "harbor-launch",
          name: "Harbor launch",
          radius: 5,
          transport: true,
          note: "Board the wooden launch west of Driftwood Camp. F climbs aboard or takes the helm; WASD steers.",
          get x() {
            return pose.x;
          },
          get z() {
            return pose.z;
          },
        },
        group,
        boat,
        dock,
        passengers,
        get aboard() {
          return boat.active && passengers.aboard(context.player.body);
        },
        beforeBodyStep: (body, controls) =>
          boat.active ? passengers.beforeBodyStep(body, controls) : controls,
        afterBodyStep: (body) => {
          if (boat.active) passengers.afterBodyStep(body);
        },
      };
      runtime = {
        context,
        boat,
        dock,
        own,
        added,
        edges,
        boxes,
        passengers,
        input,
        ui,
        storage,
        listeners,
        deck,
        dockSurface,
        initialized: false,
        saveAt: 0,
        terrainVersion: -1,
        blockedToastAt: 0,
      };
      model.visible = false;
    },
    beforePlayerUpdate(dt, context) {
      if (!runtime) return;
      const r = runtime,
        { boat, input, passengers } = r;
      const persistence = context.building?.persistence;
      if (persistence?.on && !persistence.loaded) return;
      r.dock.refresh();
      if (!boat.active && r.terrainVersion !== context.terrain.version) r.initialized = false;
      r.terrainVersion = context.terrain.version;
      if (!r.initialized) {
        r.initialized = true;
        context.vegetation?.clearBox(-83, 69.5, -75.3, 76.5, 0.3);
        context.vegetation?.clearArea({ x: -79, z: 73 }, 3.5, { canopy: 1 });
        if (r.storage.saved) {
          const saved = {
            ...r.storage.saved,
            y: context.water.sample(r.storage.saved.x, r.storage.saved.z) + 0.15,
          };
          if (boatPoseClear(context, saved, r.own)) Object.assign(boat.pose, saved);
          else
            context.hud?.toast(
              "The saved mooring is obstructed. Your boat is back at Driftwood Camp.",
            );
        }
        boat.active = boatPoseClear(context, boat.pose, r.own);
        for (const collider of r.own) collider.boatInactive = !boat.active;
        if (!boat.active)
          context.hud?.toast(
            "The harbor launch needs clear water west of Driftwood Camp. Clear the saved blocks there.",
          );
      }
      if (!boat.active) return;
      if (passengers.pilot && passengers.pilot !== passengers.active()) passengers.releaseHelm();
      const controls = input.sample();
      if (controls.blocked) boat.speed = 0;
      const moving = passengers.pilot && !controls.blocked;
      const oldX = boat.pose.x,
        oldZ = boat.pose.z,
        oldYaw = boat.pose.yaw;
      const blocked = advanceBoat(
        context,
        boat,
        dt,
        moving ? controls.throttle : 0,
        moving ? controls.steering : 0,
        r.own,
      );
      const changed =
        Math.hypot(boat.pose.x - oldX, boat.pose.z - oldZ) > 0.0001 ||
        Math.abs(boat.pose.yaw - oldYaw) > 0.0001;
      if (changed) r.storage.mark();
      if (blocked && context.time > r.blockedToastAt) {
        context.hud?.toast(
          "Shallow water or an obstacle ahead. Reverse or steer toward open water.",
        );
        r.blockedToastAt = context.time + 4;
      }
      // Vertical bobbing keeps the actual deck and actor support at the same height.
      boat.pose.y = context.water.sample(boat.pose.x, boat.pose.z) + 0.15;
      boat.model.position.set(boat.pose.x, boat.pose.y, boat.pose.z);
      boat.model.rotation.y = boat.pose.yaw;
      boat.model.visible = true;
      r.edges.update(boat.pose);
      r.boxes.update(boat.pose);
      if (changed && context.time > r.saveAt) {
        r.storage.save(boat.pose);
        r.saveAt = context.time + 3;
      }
      if (Math.abs(boat.speed) > 0.5 && context.time > (r.wakeAt ?? 0)) {
        context.water.ripple(boat.pose.x, boat.pose.z, 0.3);
        r.wakeAt = context.time + 0.5;
      }
    },
    update() {
      if (runtime) runtime.ui.update();
    },
    dispose(context) {
      if (!runtime || disposed) return;
      disposed = true;
      const r = runtime;
      r.storage.save(r.boat.pose);
      r.passengers.releaseHelm();
      r.input.dispose();
      r.ui.dispose();
      r.listeners.abort();
      context.colliders = context.colliders.filter((c) => !r.added.includes(c));
      context.walkSurfaces = context.walkSurfaces.filter(
        (f) => f !== r.deck && f !== r.dockSurface,
      );
      disposeBoatModel(context.boats.group);
      delete context.boats;
      runtime = null;
    },
  };
}
