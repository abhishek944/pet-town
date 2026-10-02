import { Vector3 } from "three";

/** Keep building, petting and ambience anchored to the avatar being followed. */
export function exposeActiveTownPlayer(context, original, getSelected, rig) {
  const forward = new Vector3();
  context.player = new Proxy(original, {
    get(target, field) {
      const record = getSelected();
      if (!record) return Reflect.get(target, field);
      switch (field) {
        case "position":
          return record.position;
        case "velocity":
          return record.body.vel;
        case "head":
          return record.head;
        case "mesh":
          return record.root;
        case "body":
          return record.body;
        case "character":
          return record.character;
        case "world":
          return record.world;
        case "facing":
          return record.facing;
        case "forward":
          return forward.set(Math.sin(record.facing), 0, Math.cos(record.facing));
        case "onGround":
          return record.body.onGround;
        case "inWater":
          return record.body.waterDepth > 0.05 || record.body.swimming;
        case "swimming":
          return record.body.swimming;
        case "gliding":
          return record.body.gliding;
        case "waterDepth":
          return record.body.waterDepth;
        case "cameraTarget":
          return rig.camera.focus;
        case "cameraDistance":
          return rig.firstPerson ? 0 : rig.camera.curDist;
        case "cameraRestDistance":
          return rig.camera.distT;
        case "foliageFade":
          return rig.foliageFading;
        default:
          return Reflect.get(target, field);
      }
    },
  });
  return () => {
    context.player = original;
  };
}
