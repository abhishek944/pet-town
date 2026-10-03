import { playerState } from "../player/state.js";
import { boatLocal, boatWorld, boatDeckHeight, insideBoat } from "./coordinates.js";
import { DECK_Y, HELM, BOARD } from "./model.js";
import { freeBoatPoint } from "./navigation.js";
import { boatExitPoint } from "./exit.js";

const NEUTRAL = { mx: 0, mz: 0, run: false, jumpHeld: false, diveHeld: false };

export function createBoatPassengers(context, boat, dock) {
  const supports = new WeakMap();
  let pilot = null;
  const active = () => {
    if (!boat.active) return null;
    const selected = context.petTown?.controller.selected;
    return selected && !selected.controlled ? null : context.player.body;
  };
  function aboard(body) {
    if (!body) return false;
    const local = boatLocal(boat.pose, body.pos);
    return (
      insideBoat(local.x, local.z, 0.08) &&
      local.y >= DECK_Y - 0.18 &&
      local.y < 3.7 &&
      !body.swimming
    );
  }
  function move(body, point) {
    body.teleport(point.x, point.y + 0.005, point.z);
    body.onGround = point.y > context.water.sample(point.x, point.z) + 0.2;
    if (body === playerState.playerRuntime.body) {
      playerState.playerRuntime.renderPos.copy(body.pos);
      context.player.position.copy(body.pos);
    } else {
      for (const record of context.petTown?.agents.records.values() ?? [])
        if (record.body === body) record.position.copy(body.pos);
    }
    supports.set(body, { ...boat.pose });
  }
  const safeExit = (body) => boatExitPoint(context, boat, dock, body);
  return {
    active,
    aboard,
    get pilot() {
      return pilot;
    },
    releaseHelm() {
      pilot = null;
      boat.speed = 0;
    },
    action() {
      const body = active();
      if (!body) return null;
      if (pilot === body)
        return {
          label: "Leave helm",
          run: () => {
            pilot = null;
            boat.speed = 0;
          },
        };
      if (aboard(body)) {
        const helm = boatWorld(boat.pose, ...HELM);
        if (Math.hypot(body.pos.x - helm.x, body.pos.z - helm.z) < 1.6)
          return {
            label: "Take helm",
            run: () => {
              const point = freeBoatPoint(context, boat, HELM);
              if (!point)
                return context.hud?.toast("The helm is obstructed. Clear a little space.");
              move(body, point);
              pilot = body;
            },
          };
        const exit = safeExit(body);
        return (
          exit && {
            label: exit.dry ? "Step ashore" : "Swim off",
            run: () => {
              const clear = safeExit(body);
              if (!clear) return context.hud?.toast("There is no clear space to get off here.");
              move(body, clear);
              supports.delete(body);
              boat.speed = 0;
            },
          }
        );
      }
      const near = boatLocal(boat.pose, body.pos);
      if (Math.abs(near.x) > 4.3 || Math.abs(near.z) > 4.5 || Math.abs(near.y) > 2.5) return null;
      return {
        label: body.swimming ? "Climb aboard" : "Board boat",
        run: () => {
          const point = freeBoatPoint(context, boat, BOARD);
          if (!point) return context.hud?.toast("The deck is obstructed. Clear a little space.");
          move(body, point);
        },
      };
    },
    beforeBodyStep(body, input) {
      const before = supports.get(body);
      if (before) {
        const local = boatLocal(before, body.pos);
        if (body.vel.y <= 0.1 && local.y >= DECK_Y - 0.2 && insideBoat(local.x, local.z, 0.05)) {
          const point = boatWorld(boat.pose, local.x, local.y, local.z);
          body.pos.set(point.x, point.y, point.z);
        } else supports.delete(body);
      }
      if (pilot === body) {
        const point = boatWorld(boat.pose, ...HELM);
        body.pos.set(point.x, point.y, point.z);
        body.vel.set(0, 0, 0);
        body.jumpBuf = 0;
        if (body === playerState.playerRuntime.body) {
          playerState.playerRuntime.facing = playerState.playerRuntime.targetFacing = boat.pose.yaw;
        }
        return NEUTRAL;
      }
      return input;
    },
    afterBodyStep(body) {
      const deck = boatDeckHeight(boat.pose, body.pos.x, body.pos.z);
      if (body.onGround && Math.abs(body.pos.y - deck) < 0.15) supports.set(body, { ...boat.pose });
      else supports.delete(body);
    },
  };
}
