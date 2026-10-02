/** Lampposts, lanterns, benches, log seats, signposts, mailboxes, barrels, crates and sacks. */
import { createPropLathe } from "../geometry/create-prop-lathe.js";
export let createPropPostCap = (value, value2) =>
  createPropLathe(
    [
      [0, 0],
      [value, 0],
      [value, value2 * 0.35],
      [value * 0.82, value2 * 0.78],
      [value * 0.45, value2 * 0.97],
      [0, value2],
    ],
    10,
  );
