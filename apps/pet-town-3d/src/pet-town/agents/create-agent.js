import * as THREE from "three";
import { playerPhysicsBody } from "../../player/physics/player-physics-body.js";
import { playerCollisionWorld } from "../../player/collision-world/player-collision-world.js";
import { agentSeed, agentRandom } from "./random.js";
import { createAgentVisual } from "./character-visual.js";
import { findAgentSpawn } from "./spawn.js";

export function createAgent(context, metadata, records, petId) {
  const seed = agentSeed(metadata.id);
  const random = agentRandom(seed);
  const world = new playerCollisionWorld(context);
  world.refresh(0);
  const body = new playerPhysicsBody(world);
  const visual = createAgentVisual(metadata, petId);
  const { character } = visual;
  const position = findAgentSpawn(context, world, random, records);
  body.spawn.copy(position);
  body.teleport(position.x, position.y, position.z);
  character.root.position.copy(position);
  context.scene.add(character.root, character.shadow);
  character.root.updateMatrixWorld(true);
  const head = character.head.getWorldPosition(new THREE.Vector3());
  return {
    ...metadata,
    ...visual,
    body,
    world,
    position,
    head,
    facing: random() * Math.PI * 2,
    controlled: false,
    input: { mx: 0, mz: 0, run: false, jumpHeld: false, jumpPressed: false },
    runAmt: 0,
    _motion: {
      random,
      accumulator: 0,
      goal: null,
      route: [],
      rest: random() * 2,
      stuck: 0,
      home: position.clone(),
      previous: position.clone(),
      wasControlled: false,
    },
  };
}
