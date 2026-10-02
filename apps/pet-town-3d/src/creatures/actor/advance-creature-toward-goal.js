import { isCreatureInsideWorld } from "../world/is-creature-inside-world.js";
import { sampleCreatureSupportHeight } from "../world/sample-creature-support-height.js";
import { sampleCreatureTerrainHeight } from "../world/sample-creature-terrain-height.js";
import { wrapCreatureAngle } from "../math/wrap-creature-angle.js";
import { clampCreatureValue } from "../math/clamp-creature-value.js";
import { dampCreatureValue } from "../math/damp-creature-value.js";
export function advanceCreatureTowardGoal(position, deltaTime, waterLevel) {
  let targetSpeed = 0;
  if (this.goal) {
    let result8 = this.goal.x - position.x;
    let result9 = this.goal.z - position.z;
    let hypotResult = Math.hypot(result8, result9);
    let wrapCreatureAngleResult = wrapCreatureAngle(Math.atan2(result8, result9) - this.yaw);
    let result10 = (this.state === `flee` ? 9 : 5.5) * deltaTime;
    this.yaw = wrapCreatureAngle(
      this.yaw + clampCreatureValue(wrapCreatureAngleResult, -result10, result10),
    );
    targetSpeed =
      this.goalSpeed *
      clampCreatureValue(1.25 - Math.abs(wrapCreatureAngleResult) / 1.3, 0, 1) *
      clampCreatureValue(hypotResult / 0.5, 0.25, 1);
  } else if (this.faceYaw != null) {
    let wrapCreatureAngleResult2 = wrapCreatureAngle(this.faceYaw - this.yaw);
    this.yaw = wrapCreatureAngle(
      this.yaw + clampCreatureValue(wrapCreatureAngleResult2, -4 * deltaTime, 4 * deltaTime),
    );
    if (Math.abs(wrapCreatureAngleResult2) > 0.3) {
      targetSpeed = 0;
    }
  }
  if (this.state === `sleep` || this.pose) {
    targetSpeed = 0;
  }
  this.speed = dampCreatureValue(this.speed, targetSpeed, this.state === `flee` ? 8 : 5, deltaTime);
  if (this.pose && this.pose.state === `walk`) {
    this.speed = this.def.walk;
  }
  let gait = this.def.gait;
  let travelSpeed = this.speed;
  if (!this.flying && !this.inWater && (gait === `hop` || gait === `bounce`)) {
    travelSpeed = this.speed * (this.air > 0 ? 1.9 : 0.05);
  }
  if (this.pose) {
    travelSpeed = 0;
  }
  let forwardX = Math.sin(this.yaw);
  let forwardZ = Math.cos(this.yaw);
  let nextX = position.x + forwardX * travelSpeed * deltaTime;
  let nextZ = position.z + forwardZ * travelSpeed * deltaTime;
  let supportY = sampleCreatureSupportHeight(position.x, position.z, this.def.radius * 0.5);
  if (travelSpeed > 1e-4) {
    let result11 = this.def.radius * 0.8 * this.size;
    if (
      this.flying
        ? isCreatureInsideWorld(nextX, nextZ)
        : this.canStandAt(nextX + forwardX * result11, nextZ + forwardZ * result11, supportY)
    ) {
      if (!this.flying && !this.airborne) {
        let result13 = this.wallR + 0.08;
        let creatureTerrainHeightResult = sampleCreatureTerrainHeight(
          position.x + forwardX * result13,
          position.z + forwardZ * result13,
        );
        let result14 =
          creatureTerrainHeightResult == null
            ? null
            : this.inWater
              ? Math.max(creatureTerrainHeightResult, waterLevel - 0.12)
              : creatureTerrainHeightResult;
        if (result14 != null && result14 > position.y + 0.12 && result14 - position.y < 1.3) {
          this.vy = Math.sqrt(44 * (result14 - position.y + 0.28));
          this.airborne = true;
          this.sq.kick(3.5);
        }
      }
      let creatureSupportHeightResult3 = sampleCreatureSupportHeight(
        nextX,
        nextZ,
        this.def.radius * 0.5,
      );
      let result12 = this.inWater
        ? Math.max(creatureSupportHeightResult3 ?? -1e9, waterLevel - 0.12)
        : creatureSupportHeightResult3;
      if (
        !this.flying &&
        creatureSupportHeightResult3 != null &&
        result12 > position.y + 0.12 &&
        position.y < result12 - 0.05
      ) {
        nextX = position.x;
        nextZ = position.z;
      }
      position.x = nextX;
      position.z = nextZ;
      this.blocked = 0;
    } else {
      this.speed *= 0.5;
      this.blocked += deltaTime;
      if (this.blocked > 0.35) {
        this.blocked = 0;
        this.goal = null;
        this.fails++;
        if (
          (this.state === `flee` ||
            this.state === `wander` ||
            this.state === `fly` ||
            this.state === `swim`) &&
          this.fails > 2
        ) {
          this.fails = 0;
          this.setState(`idle`, 1.5);
        }
      }
    }
  }
  return {
    supportY,
  };
}
