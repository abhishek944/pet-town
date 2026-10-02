import { creaturesState } from "../state.js";
import { sampleCreatureSupportHeight } from "../world/sample-creature-support-height.js";
import { emitNearbyCreatureParticles } from "../world/emit-nearby-creature-particles.js";
import { clampCreatureValue } from "../math/clamp-creature-value.js";
import { dampCreatureValue } from "../math/damp-creature-value.js";
import { getCreatureWaterSurface } from "../world/get-creature-water-surface.js";
export function updateCreatureHeightAndShadow(position, waterLevel, deltaTime) {
  let groundY = sampleCreatureSupportHeight(position.x, position.z, this.def.radius * 0.5);
  groundY ??= position.y;
  let overWater = groundY < waterLevel - 0.05;
  this.inWater = overWater && !this.flying;
  let landingY = groundY;
  if (
    (overWater &&
      !this.flying &&
      (landingY = getCreatureWaterSurface() - (this.swimmer ? 0.13 : 0.2)),
    this.inWater &&
      !this.swimmer &&
      this.state !== `escape` &&
      !this.pose &&
      this.setState(`escape`, 8),
    (this.flyH = dampCreatureValue(
      this.flyH,
      this.flying
        ? this.alt + Math.sin(creaturesState.creaturesRuntime.time * 1.3 + this.id) * 0.12
        : 0,
      this.flying ? 1.6 : 2.6,
      deltaTime,
    )),
    this.flying || this.flyH > 0.02)
  ) {
    let result32 = Math.max(groundY, waterLevel);
    position.y = Math.max(
      dampCreatureValue(position.y, result32 + this.flyH, 4, deltaTime),
      result32,
    );
    this.airborne = false;
    this.vy = 0;
  } else {
    if (
      (landingY - position.y > 1.35 &&
        ((position.y = landingY), (this.vy = 0), (this.airborne = false), this.sq.kick(-3)),
      !this.airborne && position.y > landingY + 0.04 && ((this.airborne = true), (this.vy = 0)),
      this.airborne)
    ) {
      if (
        ((this.vy -= creaturesState.creatureGravity * deltaTime),
        (position.y += this.vy * deltaTime),
        position.y <= landingY && this.vy <= 0)
      ) {
        let result33 = -this.vy;
        position.y = landingY;
        this.vy = 0;
        this.airborne = false;
        this.sq.kick(-Math.min(6, result33 * 0.9));
        if (result33 > 4.5 && !this.inWater && !this.pose) {
          emitNearbyCreatureParticles(position, `dust`, {
            count: result33 > 7 ? 6 : 3,
            scale: 0.55 * this.size,
          });
        }
      }
    } else {
      position.y =
        landingY > position.y ? landingY : dampCreatureValue(position.y, landingY, 20, deltaTime);
    }
    if (position.y < landingY && !(this.airborne && this.vy > 0)) {
      position.y = landingY;
      if (this.vy < 0) {
        this.vy = 0;
      }
    }
  }
  this.mesh.rotation.y = this.yaw;
  let speed3 = this.speed;
  this.moveAmt = dampCreatureValue(
    this.moveAmt,
    clampCreatureValue(speed3 / Math.max(0.1, this.def.walk), 0, 1.6),
    8,
    deltaTime,
  );
  let shadow = this.shadow;
  let shadowY = Math.max(groundY, waterLevel > -1e8 && overWater ? waterLevel : groundY);
  shadow.position.set(position.x, shadowY + 0.03, position.z);
  let shadowScale =
    1 / (1 + Math.max(0, position.y - shadowY + (this.air > 0 ? this.hopY : 0)) * 0.6);
  shadow.scale.setScalar(this.def.radius * 2.3 * this.size * (0.6 + 0.4 * shadowScale));
  shadow.visible = !overWater || this.flying;
}
