import { OCEAN_PLACES } from "../layout.js";
import { createCoral, createAnemone, createKelp } from "./reef-models.js";
import { createPalm, createPicnic, createRock, createShell } from "./island-models.js";
import { createWreck } from "./wreck-model.js";

/** Authored clusters frame the swim route instead of filling open water. */
export function createOceanPlacements() {
  const records = [];
  function add(placeId, offsets, factory, options) {
    const place = OCEAN_PLACES.find((item) => item.id === placeId);
    offsets.forEach(([dx, dz, rotation = 0], index) => {
      const model = factory(index);
      const x = place.x + dx;
      const z = place.z + dz;
      model.root.position.set(x, 0, z);
      model.root.rotation.y = rotation;
      records.push({ model, x, z, ...options, phase: index * 1.37 });
    });
  }
  add(
    "reef",
    [
      [-7, -4],
      [-5, -6, 0.6],
      [-3, -5, 1.4],
      [4, 5],
      [6, 4, 0.5],
      [7, 7, 1.1],
      [-8, 5],
      [-6, 7, 2],
      [2, -7, 1],
    ],
    createCoral,
    { wet: true, radius: 0.65, clearance: 1.75 },
  );
  add(
    "reef",
    [
      [-4, -6],
      [6, 6, 0.7],
      [-7, 6],
      [3, -6, 1],
    ],
    createAnemone,
    { wet: true, radius: 0.45, clearance: 0.8 },
  );
  add(
    "lagoon",
    [
      [-5, -8],
      [-7, -6, 1],
      [-8, 5],
    ],
    createAnemone,
    { wet: true, radius: 0.45, clearance: 0.8 },
  );
  add(
    "kelp",
    [
      [-5.5, -5.5],
      [-3.5, -4.5],
      [-6.5, -2.5],
      [-7.5, 1.5],
      [-5.5, 4.5],
      [-3.5, 6.5],
      [5.5, -4.5],
      [6.5, -1.5],
      [7.5, 2.5],
      [5.5, 4.5],
      [3.5, 6.5],
      [6.5, 6.5],
    ],
    createKelp,
    { wet: true, radius: 0.4, clearance: 3.6, sway: true },
  );
  add("wreck", [[0, 0, -0.4]], createWreck, { wet: true, radius: 3, clearance: 1.1 });
  add(
    "wreck",
    [
      [-4, -3],
      [4, 2, 1],
    ],
    createCoral,
    { wet: true, radius: 0.65, clearance: 1.75 },
  );
  add(
    "island",
    [
      [-4.5, -2.5],
      [-5.5, 3.5, 1.4],
      [1.5, -5.5, 2.2],
    ],
    createPalm,
    { wet: false, radius: 0.35 },
  );
  add("island", [[1, 1, 0.4]], createPicnic, { wet: false, radius: 1.5 });
  add(
    "island",
    [
      [-12.5, 2.5],
      [-10.5, -7.5, 0.5],
      [8.5, -8.5, 1.5],
      [5.5, 9.5, 0.3],
    ],
    createRock,
    { wet: false, radius: 0.45 },
  );
  add(
    "island",
    [
      [12.5, -4.5],
      [12.5, -6.5],
      [10.5, 7.5],
      [8.5, 9.5],
      [-4.5, 10.5],
      [-10.5, 7.5],
    ],
    createShell,
    { wet: false, radius: 0.2 },
  );
  return records;
}
