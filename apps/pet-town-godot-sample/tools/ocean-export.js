import * as THREE from "../../pet-town-3d/node_modules/three/build/three.module.js";
import { glb, json } from "./region-data.js";
import { oceanExperiences } from "./ocean-experiences.js";
import { OCEAN_PLACES, OFFSHORE_ISLAND } from "../../pet-town-3d/src/water/layout.js";
import { createOceanPlacements } from "../../pet-town-3d/src/water/scenery/placements.js";
import { reseatOceanScenery } from "../../pet-town-3d/src/water/scenery/support.js";
import { createMarineResources } from "../../pet-town-3d/src/water/wildlife/resources.js";
import { createMarineHabitat } from "../../pet-town-3d/src/water/wildlife/habitat.js";
import { createDolphins } from "../../pet-town-3d/src/water/wildlife/dolphins.js";
import { createSeaTurtles } from "../../pet-town-3d/src/water/wildlife/turtles.js";
import { createHarborLaunch, DECK_Y, HELM, BOARD } from "../../pet-town-3d/src/boats/model.js";
import { createHarborDock, BOAT_HOME, DOCK } from "../../pet-town-3d/src/boats/dock.js";
import { persistenceState } from "../../pet-town-3d/src/persistence/state.js";

function saved(suffix) {
  const raw = localStorage.getItem(`${persistenceState.persistenceLocalStoragePrefix}${suffix}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { unreadable: true, raw };
  }
}

export async function exportOcean(ctx, manifest, report = () => {}) {
  const data = {
    v: 1,
    source: "Three.js water and boats authored models and runtime constants",
    places: OCEAN_PLACES,
    experiences: oceanExperiences,
    island: OFFSHORE_ISLAND,
    area: ctx.terrain.ocean,
    scenery: [],
    wildlife: {},
    boat: {
      home: BOAT_HOME,
      dock: DOCK,
      deckY: DECK_Y,
      helm: HELM,
      board: BOARD,
      saved: saved("harbor-launch"),
    },
    progress: saved("ocean-discoveries"),
  };
  const records = createOceanPlacements();
  for (let i = 0; i < records.length; i++) {
    report(`Ocean scenery ${i + 1}/${records.length}`);
    const record = records[i];
    reseatOceanScenery(ctx, record);
    const root = record.model.root;
    const position = root.position.toArray();
    const yaw = root.rotation.y;
    const visible = root.visible;
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.visible = true;
    const file = `ocean-scenery-${i}.glb`;
    await glb(file, root);
    data.scenery.push({
      file,
      position,
      yaw,
      visible,
      wet: record.wet,
      radius: record.radius,
      clearance: record.clearance ?? 0,
      sway: !!record.sway,
      phase: record.phase,
    });
    record.model.dispose();
  }
  report("Ocean dolphins, turtles and fish");
  const resources = createMarineResources();
  const group = new THREE.Group();
  const habitat = createMarineHabitat(ctx);
  createDolphins(ctx, group, resources, habitat);
  createSeaTurtles(ctx, group, resources, habitat);
  for (const model of group.children) {
    const file = `${model.name}.glb`;
    model.position.set(0, 0, 0);
    let moving = 0;
    for (const part of model.children)
      if (part.isGroup) part.name = model.name.includes("dolphin") ? "Tail" : `Flipper${moving++}`;
    await glb(file, model);
    data.wildlife[model.name] = file;
  }
  data.schools = [
    { place: "reef", color: 0xf3b354, fin: 0xe76f61, count: 18, radius: 6, speed: 0.23, depth: 2 },
    {
      place: "reef",
      color: 0x54c6d3,
      fin: 0x337eae,
      count: 18,
      radius: 9,
      speed: -0.16,
      depth: 3.4,
    },
    {
      place: "kelp",
      color: 0xb5d992,
      fin: 0x5baf96,
      count: 18,
      radius: 7,
      speed: 0.19,
      depth: 2.8,
    },
  ];
  for (let i = 0; i < data.schools.length; i++) {
    const school = data.schools[i],
      fish = new THREE.Group();
    resources.mesh(fish, "round", school.color, [0, 0, 0], [0.12, 0.21, 0.48]);
    const tail = resources.mesh(fish, "tail", school.fin, [0, 0, -0.52], [0.55, 0.6, 0.6]);
    tail.name = "Tail";
    resources.mesh(fish, "dorsal", school.fin, [0, 0.12, 0], [0.5, 0.3, 0.6]);
    resources.mesh(fish, "round", 0xf4eaca, [0, -0.11, 0], [0.108, 0.075, 0.36]);
    for (const side of [-1, 1])
      resources.mesh(fish, "round", 0x173a40, [side * 0.103, 0.06, 0.27], [0.035, 0.035, 0.035]);
    school.file = `ocean-fish-${i}.glb`;
    await glb(school.file, fish);
  }
  resources.dispose();
  report("Ocean Harbor launch and dock");
  const launch = createHarborLaunch();
  await glb("ocean-harbor-launch.glb", launch);
  const dock = createHarborDock(ctx);
  dock.model.position.set(0, 0, 0);
  await glb("ocean-harbor-dock.glb", dock.model);
  data.boat.file = "ocean-harbor-launch.glb";
  data.boat.dockFile = "ocean-harbor-dock.glb";
  data.boat.dockShore = ctx.terrain.topY(DOCK.shoreX, DOCK.z) + 0.03;
  manifest.oceanFile = "ocean-manifest.json";
  await json(manifest.oceanFile, data);
  return data;
}
