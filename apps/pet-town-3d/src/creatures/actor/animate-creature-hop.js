import { emitNearbyCreatureParticles } from "../world/emit-nearby-creature-particles.js";
import { clampCreatureValue } from "../math/clamp-creature-value.js";
export function animateCreatureHop(gait, deltaTime, species, isFlying) {
  let hopHeight = 0;
  let hopPhase = 0;
  if (gait === `trot` || gait === `scuttle`) {
    this.phase +=
      deltaTime * (this.speed / Math.max(0.05, species.stride)) * (gait === `scuttle` ? 1 : 0.5);
  } else if (
    (gait === `hop` || gait === `bounce` || gait === `hop2`) &&
    !isFlying &&
    !this.inWater
  ) {
    if (this.speed > 0.08 || this.air > 0 || this.idleHop > 0) {
      let result21 = this.phase % 1;
      this.phase +=
        deltaTime *
        species.hopRate *
        (this.state === `flee` ? 1.5 : 1) *
        (this.speed > 0.08 ? clampCreatureValue(this.speed / species.walk, 0.8, 1.6) : 1);
      let result22 = this.phase % 1;
      let result23 = gait === `bounce` ? 0.28 : 0.22;
      if (result21 < result23 && result22 >= result23) {
        this.sq.kick(gait === `bounce` ? 7 : 4);
      }
      if (result22 < result21) {
        this.sq.kick(gait === `bounce` ? -8 : -4);
        this.idleHop = Math.max(0, this.idleHop - 1);
        if (!this.pose && this.rng() < (gait === `bounce` ? 0.4 : 0.2)) {
          emitNearbyCreatureParticles(this.position, `dust`, {
            count: 2,
            scale: 0.4 * this.size,
          });
        }
      }
      if (result22 > result23) {
        hopPhase = Math.sin((Math.PI * (result22 - result23)) / (1 - result23));
      }
      if (result22 <= result23 && result22 > result23 * 0.4) {
        this.sq.x = Math.min(this.sq.x, -0.12 * (gait === `bounce` ? 1.4 : 1));
      }
      let result24 =
        species.hopH *
        (this.idleHop > 0 && this.speed < 0.08 ? 0.8 : 1) *
        (this.state === `happy` ? 1.3 : 1);
      hopHeight = hopPhase * result24;
    } else {
      this.phase = Math.ceil(this.phase);
    }
  } else {
    if (gait === `hop2` || gait === `hop` || gait === `bounce`) {
      this.phase += deltaTime * 1.2;
    }
  }
  if ((gait === `trot` || gait === `scuttle`) && this.idleHop > 0 && !this.airborne && !isFlying) {
    this.vy = 4.2;
    this.airborne = true;
    this.idleHop = 0;
    this.sq.kick(5);
  }
  this.air = hopPhase;
  this.hopY = hopHeight;
  return {
    hopHeight,
    hopPhase,
  };
}
