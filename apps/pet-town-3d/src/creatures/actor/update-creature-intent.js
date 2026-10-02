/** Creature state machine, social behavior, movement, animation and interaction methods. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { isCreaturePositionUnderwater } from "../world/is-creature-position-underwater.js";
import { emitNearbyCreatureParticles } from "../world/emit-nearby-creature-particles.js";
export function updateCreatureIntent(player, deltaTime, frame, wantsSleep) {
  switch (
    (player &&
      this.lookT <= 0 &&
      Math.hypot(player.x - this.position.x, player.z - this.position.z) < 5 &&
      this.rng() < 0.5 &&
      ((this.look = new THREE.Vector3(player.x, player.y + 1.3, player.z)),
      (this.lookT = this.rng.range(1.5, 3))),
    this.state)
  ) {
    case `idle`:
      this.goal = null;
      if (this.lookT <= 0 && this.rng() < deltaTime * 0.8) {
        this.randomLook();
      }
      if (this.t > this.dur) {
        this.chooseNext(frame);
      }
      break;
    case `look`:
      this.goal = null;
      if (this.lookT <= 0) {
        this.randomLook();
      }
      if (this.t > this.dur) {
        this.tiltGoal = 0;
        this.chooseNext(frame);
      }
      break;
    case `wander`:
    case `swim`:
    case `fly`:
      if (!this.goal) {
        let result2 =
          this.state === `swim`
            ? {
                water: true,
              }
            : {};
        let result3 = this.state === `fly` ? 9 : this.state === `swim` ? 4 : 5;
        let result4 = this.state === `swim` ? (this.waterSpot ?? this.position) : this.home;
        if (
          ((this.goal = this.pickTarget(result3, result4, result2)),
          (this.goalSpeed =
            this.def.walk * (this.state === `fly` ? 1.6 : 1) * (0.85 + 0.3 * this.rng())),
          !this.goal)
        ) {
          this.setState(`idle`, 1.5);
          break;
        }
      }
      if (this.arrived(0.35)) {
        if (this.state === `fly` && !this.flyer) {
          this.state = `land`;
          this.goal = null;
        } else {
          if (this.state === `swim` && this.t < this.dur) {
            this.goal = null;
          } else {
            this.setState(`idle`, this.rng.range(1.5, 4));
          }
        }
      }
      if (this.t > this.dur + 12) {
        this.setState(`idle`, 2);
      }
      if (this.rng() < deltaTime * 0.05) {
        this.emote(this.rng.pick(this.def.emotes), 1.5);
      }
      break;
    case `land`:
      if (this.flying && isCreaturePositionUnderwater(this.position.x, this.position.z)) {
        if (!this.goal) {
          this.goal = this.findShore();
          this.goalSpeed = this.def.walk * 1.4;
          if (!this.goal) {
            this.flying = false;
          }
        }
        break;
      }
      this.goal = null;
      this.flying = false;
      if (this.flyH < 0.04) {
        this.setState(wantsSleep ? `sleep` : `idle`, 2);
      }
      break;
    case `rest`:
      this.goal = null;
      if (this.rng() < deltaTime * 0.08) {
        this.mouthOpenT = 0.8;
      }
      if (this.t > this.dur) {
        this.setState(`idle`, 1.5);
        this.sq.kick(3);
      }
      break;
    case `graze`:
      if (((this.goal = null), this.traits.grazer && this.rng() < deltaTime * 0.5)) {
        let copy = this.headWorld.clone();
        copy.y -= 0.25 * this.size;
        emitNearbyCreatureParticles(copy, `leaves`, {
          count: 2,
          scale: 0.35,
        });
      }
      if (this.rng() < deltaTime * 0.25) {
        this.emote(this.traits.sniffer ? `question` : `leaf`, 1.2);
      }
      if (this.t > this.dur) {
        this.setState(`idle`, 1.5);
      }
      break;
    case `play`:
      this.playTick(deltaTime, frame);
      break;
    case `approach`: {
      if (!player) {
        this.setState(`idle`, 1);
        break;
      }
      let hypotResult2 = Math.hypot(player.x - this.position.x, player.z - this.position.z);
      this.look = new THREE.Vector3(player.x, player.y + 1.2, player.z);
      this.lookT = 0.5;
      let result5 = 1.3 + this.def.radius;
      if (hypotResult2 > 11 || this.t > this.dur) {
        this.setState(`idle`, 2);
        this.tiltGoal = 0;
        break;
      }
      if (hypotResult2 > result5) {
        let normalizeResult = creaturesState.creatureWorldTargetScratch
          .set(player.x - this.position.x, 0, player.z - this.position.z)
          .normalize();
        this.goal = new THREE.Vector3(
          player.x - normalizeResult.x * result5,
          player.y,
          player.z - normalizeResult.z * result5,
        );
        this.goalSpeed = this.def.walk * 1.4;
      } else {
        this.setState(`greet`, this.rng.range(3, 6));
        this.emote(this.rng() < 0.6 ? `heart` : this.rng.pick(this.def.emotes), 1.6, true);
        this.sq.kick(-2.5);
        this.idleHop = 1;
      }
      break;
    }
    case `greet`:
      if (((this.goal = null), !player)) {
        this.setState(`idle`, 1);
        break;
      }
      if (
        ((this.look = new THREE.Vector3(player.x, player.y + 1.2, player.z)),
        (this.lookT = 0.5),
        (this.faceYaw = Math.atan2(player.x - this.position.x, player.z - this.position.z)),
        Math.hypot(player.x - this.position.x, player.z - this.position.z) >
          3.5 + this.def.radius && this.t > 1)
      ) {
        this.setState(`approach`, 5);
        break;
      }
      if (this.rng() < deltaTime * 0.4) {
        this.idleHop = 1;
      }
      if (this.t > this.dur) {
        this.tiltGoal = 0;
        this.setState(`idle`, 2);
        this.playerCd = 8;
      }
      break;
    case `flee`:
      if (this.arrived(0.5) || this.t > this.dur) {
        this.setState(`idle`, 2);
        this.playerCd = 6;
      }
      break;
    case `escape`:
      if (!this.inWater) {
        this.setState(`idle`, 1);
        break;
      }
      if (!this.goal || this.t > 6) {
        this.goal = this.findShore();
        this.goalSpeed = this.def.walk;
        this.t = 0;
      }
      break;
    default:
      this.setState(`idle`, 2);
  }
}
