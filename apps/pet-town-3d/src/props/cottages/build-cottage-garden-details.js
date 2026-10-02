/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { buildBarrelProp } from "../street-furniture/build-barrel-prop.js";
import { createNoisyPropRock } from "../geometry/create-noisy-prop-rock.js";
import { mixPropScalar } from "../math/mix-prop-scalar.js";
import { createIvyLeafGeometry } from "../building-details/create-ivy-leaf-geometry.js";
export function buildCottageGardenDetails(cottage) {
  if (
    (cottage.settings.barrel &&
      (cottage.builder.push(cottage.width / 2 - 0.15, 0, cottage.depth / 2 + 0.75),
      buildBarrelProp(cottage.builder, cottage.random, {
        water: true,
        h: 0.9,
        r: 0.36,
      }),
      cottage.builder.pop(),
      cottage.metadata.colliders.push({
        x: cottage.width / 2 - 0.15,
        z: cottage.depth / 2 + 0.75,
        radius: 0.4,
        h: 0.9,
      })),
    cottage.settings.porch !== `veranda`)
  ) {
    let result134 = cottage.settings.flowers ?? propsState.propPalette.pink;
    for (let [result135, result136] of [
      [cottage.doorX + cottage.porchWidth / 2 + 0.45, 0.42],
      [cottage.width / 2 - 1.05, 0.36],
    ]) {
      if (!(result135 + result136 > cottage.width / 2 + 0.1)) {
        cottage.builder.add(
          `leaf`,
          createNoisyPropRock(result136, 2, 0.22, 3, cottage.random.next() * 9, 0.85),
          {
            x: result135,
            y: result136 * 0.72,
            z: cottage.depth / 2 + 0.25 + result136 * 0.6,
            tint: cottage.random.chance(0.5) ? propsState.propPalette.leaf : 6069316,
          },
        );
        for (let index9 = 0; index9 < 11; index9++) {
          let rangeResult2 = cottage.random.range(-0.3, Math.PI + 0.3);
          let rangeResult3 = cottage.random.range(0.1, 1.2);
          let result137 = result136 * 1.08;
          cottage.builder.add(`plain`, new THREE.SphereGeometry(0.05, 6, 4), {
            x: result135 + Math.cos(rangeResult2) * result137 * Math.cos(rangeResult3),
            y: result136 * 0.72 + Math.sin(rangeResult3) * result137 * 0.85,
            z:
              cottage.depth / 2 +
              0.25 +
              result136 * 0.6 +
              Math.sin(rangeResult2) * result137 * Math.cos(rangeResult3),
            tint: index9 % 4 ? result134 : 16777215,
            noAO: true,
          });
        }
      }
    }
  }
  if (cottage.settings.ivy) {
    let result138 = -cottage.depth / 2 + 0.55;
    let result139 = -cottage.width / 2 - 0.19;
    for (let [result140, result141, result142] of [
      [result138, 0.35, cottage.eaveY - 0.1],
      [result138 + 0.5, 0.25, cottage.eaveY - 0.8],
    ]) {
      let values3 = [];
      for (let index10 = 0; index10 <= 10; index10++) {
        let result143 = index10 / 10;
        values3.push(
          new THREE.Vector3(
            result139,
            0.15 + result143 * (result142 - 0.15),
            result140 + Math.sin(result143 * 7 + result140) * result141 * result143,
          ),
        );
      }
      let catmullRomCurve3 = new THREE.CatmullRomCurve3(values3);
      cottage.builder.add(`wood`, new THREE.TubeGeometry(catmullRomCurve3, 24, 0.025, 4), {
        tint: 7031342,
        noAO: true,
        uv: {
          mode: `native`,
          su: 4,
          sv: 0.1,
        },
      });
      for (let index11 = 0; index11 < 34; index11++) {
        let nextResult = cottage.random.next();
        let pointResult = catmullRomCurve3.getPoint(nextResult);
        let signResult = cottage.random.sign();
        let result144 = mixPropScalar(1.25, 0.7, nextResult) * cottage.random.range(0.8, 1.15);
        cottage.builder.add(`leaf`, createIvyLeafGeometry(), {
          x: pointResult.x - 0.03 - cottage.random.next() * 0.03,
          y: pointResult.y,
          z: pointResult.z + signResult * cottage.random.range(0.02, 0.12),
          ry: -Math.PI / 2 + cottage.random.range(-0.35, 0.35),
          rz: signResult * cottage.random.range(0.4, 1.3),
          sx: result144,
          sy: result144,
          sz: result144,
          tint: cottage.random.pick(propsState.ivyLeafPalette),
          jitter: 0.06,
        });
      }
    }
  }
}
