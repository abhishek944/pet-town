/** Creature state machine, social behavior, movement, animation and interaction methods. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { getCreaturePrefab } from "../prefabs/get-creature-prefab.js";
import { cloneCreatureSkinnedRig } from "../prefabs/clone-creature-skinned-rig.js";
import { creatureJiggleBone } from "../jiggle/creature-jiggle-bone.js";
import { creatureEmoteBubble } from "../emotes/creature-emote-bubble.js";
import { creatureAnimationSpring } from "../math/creature-animation-spring.js";
export function initializeCreatureActor(species, variantIndex, x, z, random) {
  this.id = creaturesState.nextCreatureId++;
  this.def = species;
  this.species = species.id;
  this.name = species.name;
  this.variant = variantIndex;
  this.rare = !!species.variants[variantIndex].rare;
  this.rng = random;
  let creaturePrefabResult = getCreaturePrefab(species, variantIndex);
  this.mesh = cloneCreatureSkinnedRig(creaturePrefabResult.root);
  this.mesh.name = `creature:` + species.id;
  this.mesh.userData.creature = this;
  this.size = random.range(0.9, 1.08) * (species.scale ?? 1);
  this.mesh.scale.setScalar(this.size);
  this.position = this.mesh.position;
  this.position.set(x, 0, z);
  this.home = new THREE.Vector3(x, 0, z);
  this.yaw = random.range(-Math.PI, Math.PI);
  this.speed = 0;
  this.vy = 0;
  this.airborne = false;
  this.flyH = 0;
  this.traits = species.traits;
  let result = (this.parts = {
    legs: [],
    wings: [],
    eyes: [],
    jiggles: [],
  });
  this.mesh.traverse((nameValue) => {
    if (
      (nameValue.name === `bob`
        ? (result.bob = nameValue)
        : nameValue.name === `body`
          ? (result.body = nameValue)
          : nameValue.name === `head`
            ? (result.head = nameValue)
            : nameValue.name === `eyeL` || nameValue.name === `eyeR`
              ? result.eyes.push({
                  root: nameValue,
                  open: nameValue.getObjectByName(`open`),
                  shut: nameValue.getObjectByName(`shut`),
                  happy: nameValue.getObjectByName(`happy`),
                })
              : nameValue.name === `mouthClosed`
                ? (result.mouthClosed = nameValue)
                : nameValue.name === `mouthOpen`
                  ? (result.mouthOpen = nameValue)
                  : nameValue.name === `mouthHappy`
                    ? (result.mouthHappy = nameValue)
                    : nameValue.name === `blushHappy`
                      ? (result.blushHappy = nameValue)
                      : nameValue.name === `tongueFlick`
                        ? (result.tongue = nameValue)
                        : nameValue.name === `jaw`
                          ? (result.jaw = nameValue)
                          : nameValue.name === `heart` && (result.heart = nameValue),
      nameValue.userData.leg)
    ) {
      let result2 = nameValue.children.find((nameValue2) => nameValue2.name === `knee`) ?? null;
      result.legs.push({
        obj: nameValue,
        knee: result2,
        ...nameValue.userData.leg,
        r0: nameValue.rotation.clone(),
      });
    }
    if (
      (nameValue.userData.wing &&
        result.wings.push({
          obj: nameValue,
          ...nameValue.userData.wing,
          r0: nameValue.rotation.clone(),
        }),
      nameValue.userData.jiggle && result.jiggles.push(new creatureJiggleBone(nameValue)),
      nameValue.isSkinnedMesh)
    ) {
      let bounds2 = nameValue.userData.bounds;
      nameValue.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(bounds2[0], bounds2[1], bounds2[2]),
        bounds2[3],
      );
      nameValue.layers.set(creaturesState.creatureRenderLayer);
    }
  });
  this.proxies = (creaturePrefabResult.root.userData.proxies ?? [])
    .map((boneValue) => ({
      bone: this.mesh.getObjectByName(boneValue.bone),
      m: new THREE.Matrix4().compose(
        new THREE.Vector3(...boneValue.center),
        creaturesState.creatureIdentityQuaternion,
        new THREE.Vector3(...boneValue.half),
      ),
    }))
    .filter((boneValue2) => boneValue2.bone);
  if (result.jaw) {
    result.jawRot0 = result.jaw.rotation.x;
  }
  this.castsShadow = true;
  result.bodyY0 = result.body.position.y;
  result.headPos0 = result.head.position.clone();
  result.headRot0 = result.head.rotation.clone();
  result.bodyRot0 = result.body.rotation.clone();
  this.shadowSlot = creaturesState.creaturesRuntime.shadowCount++;
  this.shadow = {
    position: new THREE.Vector3(),
    scale: new THREE.Vector3(1, 1, 1),
    visible: true,
  };
  if (species.glowHalo) {
    this.halo = new THREE.Sprite(creaturesState.creaturesRuntime.haloMat);
    this.halo.scale.setScalar(species.glowHalo);
    this.halo.position.set(0, species.height * 0.5, -0.05);
    this.halo.renderOrder = 4;
    this.halo.layers.set(creaturesState.creatureRenderLayer);
    this.mesh.add(this.halo);
  }
  this.emoter = new creatureEmoteBubble(this.mesh, species.height, species.headY);
  this.emoter.sprite.layers.set(creaturesState.creatureRenderLayer);
  this.sq = new creatureAnimationSpring(260, 13);
  this.lean = new creatureAnimationSpring(90, 12);
  this.roll = new creatureAnimationSpring(90, 12);
  this.phase = random();
  this.moveAmt = 0;
  this.air = 0;
  this.t = 0;
  this.dur = 2;
  this.state = `idle`;
  this.goal = null;
  this.goalSpeed = 0;
  this.look = null;
  this.lookT = 0;
  this.faceYaw = null;
  this.headYaw = 0;
  this.headPitch = 0;
  this.headTilt = 0;
  this.tiltGoal = 0;
  this.blinkT = random.range(0.5, 3);
  this.blink = 0;
  this.blinkTwice = false;
  this.graze = 0;
  this.sleep = 0;
  this.happyT = 0;
  this.happy = 0;
  this.mouthOpenT = 0;
  this.emoteCd = random.range(2, 6);
  this.playerCd = random.range(0, 3);
  this.blocked = 0;
  this.fails = 0;
  this.sleepBias = random.range(-0.12, 0.12);
  this.buddy = null;
  this.role = null;
  this.affection = 0;
  this.breath = random() * 10;
  this.wobble = 0;
  this.inWater = false;
  this.flying = false;
  this.alt = 0;
  this.lastPos = new THREE.Vector3();
  this.progressT = 0;
  this.visSpeed = 0;
  this.idleHop = 0;
  this.sprite = null;
  this.pose = null;
  this.bodyR = species.radius * this.size;
  this.wallR = Math.min(0.4, this.bodyR * 0.72);
  this.radius = Math.max(0.85, this.bodyR * 2.2);
}
