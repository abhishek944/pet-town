/** Creature lifecycle, context integration, lighting, animation distance limits and shadow batches. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { getCreatureMaterials } from "../materials/get-creature-materials.js";
import { createCreatureRandom } from "../math/create-creature-random.js";
import { creatureEmoteParticlePool } from "../emotes/creature-emote-particle-pool.js";
import { raycastCreature } from "../interaction/raycast-creature.js";
import { petCreature } from "../interaction/pet-creature.js";
import { ensureCreaturesSpawned } from "../spawning/ensure-creatures-spawned.js";
import { handleCreaturePointerDown } from "../interaction/handle-creature-pointer-down.js";
export function initializeCreatures(context) {
  let numberResult = Number(context.params?.get?.(`creatureSeed`));
  creaturesState.creaturesRuntime = {
    ctx: context,
    list: [],
    group: new THREE.Group(),
    seed: Number.isFinite(numberResult) && numberResult ? numberResult : 20240611,
    spawned: false,
    dirty: false,
    time: 0,
    player: new THREE.Vector3(),
    playerPrev: null,
    playerSpeed: 0,
    shadowGeo: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    shadowCount: 0,
  };
  creaturesState.creaturesRuntime.shadows = new THREE.InstancedMesh(
    creaturesState.creaturesRuntime.shadowGeo,
    getCreatureMaterials().shadow,
    64,
  );
  creaturesState.creaturesRuntime.shadows.name = `creatureBlobShadows`;
  creaturesState.creaturesRuntime.shadows.renderOrder = 1;
  creaturesState.creaturesRuntime.shadows.count = 0;
  creaturesState.creaturesRuntime.shadows.frustumCulled = false;
  creaturesState.creaturesRuntime.shadows.layers.set(creaturesState.creatureRenderLayer);
  creaturesState.creaturesRuntime.proxyMax = 160;
  creaturesState.creaturesRuntime.proxy = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 7),
    new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
    }),
    creaturesState.creaturesRuntime.proxyMax,
  );
  creaturesState.creaturesRuntime.proxy.name = `creatureShadowProxies`;
  creaturesState.creaturesRuntime.proxy.castShadow = true;
  creaturesState.creaturesRuntime.proxy.receiveShadow = false;
  creaturesState.creaturesRuntime.proxy.frustumCulled = false;
  creaturesState.creaturesRuntime.proxy.count = 0;
  creaturesState.creaturesRuntime.proxy.layers.set(creaturesState.creatureRenderLayer);
  creaturesState.creaturesRuntime.tierShadows = true;
  {
    let element = document.createElement(`canvas`);
    element.width = element.height = 64;
    let painter = element.getContext(`2d`);
    let radialGradientResult = painter.createRadialGradient(32, 32, 0, 32, 32, 31);
    radialGradientResult.addColorStop(0, `rgba(255,240,170,0.75)`);
    radialGradientResult.addColorStop(0.2, `rgba(255,228,150,0.42)`);
    radialGradientResult.addColorStop(0.5, `rgba(255,215,140,0.12)`);
    radialGradientResult.addColorStop(1, `rgba(255,200,120,0)`);
    painter.fillStyle = radialGradientResult;
    painter.fillRect(0, 0, 64, 64);
    let texture = new THREE.CanvasTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;
    creaturesState.creaturesRuntime.haloMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: 2,
      toneMapped: false,
      opacity: 0,
    });
  }
  creaturesState.creaturesRuntime.rng = createCreatureRandom(creaturesState.creaturesRuntime.seed);
  creaturesState.creaturesRuntime.group.name = `creatures`;
  context.scene.add(creaturesState.creaturesRuntime.group);
  creaturesState.creaturesRuntime.group.add(
    creaturesState.creaturesRuntime.shadows,
    creaturesState.creaturesRuntime.proxy,
  );
  getCreatureMaterials();
  creaturesState.creaturesRuntime.icons = new creatureEmoteParticlePool(context.scene);
  context.creatures = creaturesState.creaturesRuntime.list;
  context.__creatureState = creaturesState.creaturesRuntime;
  context.creatureSpecies = creaturesState.creatureSpeciesDefinitions.map(
    ({ id: value, name: value2, blurb: value3 }) => ({
      id: value,
      name: value2,
      blurb: value3,
    }),
  );
  context.creatureAt = (value4) => raycastCreature(value4);
  context.petCreature = (value5) => petCreature(value5);
  ensureCreaturesSpawned();
  creaturesState.creaturesRuntime.hookedTerrain = context.terrain;
  try {
    if (typeof context.terrain?.onChange == `function`) {
      context.terrain.onChange(() => {
        creaturesState.creaturesRuntime.dirty = true;
      });
      context.terrain.__creatureHook = true;
    }
  } catch {}
  addEventListener(`pointerdown`, handleCreaturePointerDown, {
    capture: true,
  });
  context.camera?.layers?.enable(creaturesState.creatureRenderLayer);
}
