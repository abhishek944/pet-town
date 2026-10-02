/** Windmill tower and separately animated sail geometry. */
import * as THREE from "three";
import { createPropLathe } from "../geometry/create-prop-lathe.js";
import { propsState } from "../state.js";
export function buildWindmillRoof(windmill) {
  windmill.roofProfile = [];
  for (let index2 = 0; index2 <= 10; index2++) {
    let result19 = index2 / 10;
    let result20 =
      1.85 * Math.cos((result19 * Math.PI) / 2) * (1 - 0.18 * Math.sin(result19 * Math.PI));
    windmill.roofProfile.push([
      Math.max(result20, 0.02),
      windmill.towerHeight + Math.sin((result19 * Math.PI) / 2) * 2.1 + 0.05,
    ]);
  }
  windmill.builder.add(
    `wood`,
    createPropLathe(
      [
        [1.5, 6.75],
        [1.95, 6.75],
        [1.95, 6.92],
        [windmill.topRadius, 6.92],
      ],
      16,
    ),
    {
      tint: propsState.propPalette.woodDark,
      uv: {
        mode: `native`,
        su: 5,
        sv: 0.2,
      },
    },
  );
  windmill.builder.add(`shingle`, createPropLathe(windmill.roofProfile, 20), {
    tint: windmill.settings.roof ?? propsState.propPalette.roofBlue,
    noAO: true,
    uv: {
      mode: `native`,
      su: (propsState.buildingFullTurn * 1.85) / 2.2,
      sv: 2.6 / 2.2,
      ov: 0.05,
    },
  });
  windmill.builder.add(
    `metal`,
    createPropLathe(
      [
        [0.001, 0],
        [0.12, 0.02],
        [0.14, 0.12],
        [0.05, 0.3],
        [0.02, 0.6],
        [0.001, 0.62],
      ],
      10,
    ),
    {
      y: 8.9,
      tint: propsState.propPalette.brass,
      noAO: true,
    },
  );
  windmill.builder.add(`metal`, new THREE.SphereGeometry(0.12, 10, 8), {
    y: 9.15,
    tint: propsState.propPalette.brass,
    noAO: true,
  });
}
