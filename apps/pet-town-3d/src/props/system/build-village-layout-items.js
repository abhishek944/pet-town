import { buildRockClusterProp } from "../stonework/build-rock-cluster-prop.js";
import { buildPathStepsProp } from "../stonework/build-path-steps-prop.js";
import { buildSackProp } from "../street-furniture/build-sack-prop.js";
import { buildWashingLineProp } from "../garden-geometry/build-washing-line-prop.js";
import { buildMailboxProp } from "../street-furniture/build-mailbox-prop.js";
import { buildSignpostProp } from "../street-furniture/build-signpost-prop.js";
import { buildVillageLamp } from "./build-village-lamp.js";
import { buildLogSeatProp } from "../street-furniture/build-log-seat-prop.js";
import { buildBenchProp } from "../street-furniture/build-bench-prop.js";
import { buildBridgeProp } from "./build-bridge-prop.js";
import { buildGardenProp } from "./build-garden-prop.js";
import { buildVillageCampfire } from "./build-village-campfire.js";
import { buildVillageStall } from "./build-village-stall.js";
import { buildVillageWindmill } from "./build-village-windmill.js";
import { buildVillageCottage } from "./build-village-cottage.js";
import { buildVillageCrateStack } from "./build-village-crate-stack.js";
/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { buildBarrelProp } from "../street-furniture/build-barrel-prop.js";
import { buildCrateProp } from "../street-furniture/build-crate-prop.js";
export function buildVillageLayoutItems(build) {
  build.layout.items.forEach((placement, placementIndex) => {
    let tag = `i` + placementIndex;
    try {
      switch (placement.type) {
        case `cottage`:
          buildVillageCottage(build, placement, tag);
          break;
        case `windmill`:
          buildVillageWindmill(build, placement, tag);
          break;
        case `stall`:
          buildVillageStall(build, placement, tag);
          break;
        case `campfire`:
          buildVillageCampfire(build, placement, tag);
          break;
        case `garden`:
          buildGardenProp(
            build.builder,
            build.random,
            build.beginRecord(tag, placement),
            build.terrain,
            build.registerEntry,
            build.registerCollider,
          );
          break;
        case `bridge`:
          buildBridgeProp(
            build.builder,
            build.random,
            build.beginRecord(tag, placement),
            build.terrain,
            build.registerCollider,
          );
          break;
        case `bench`:
          build.buildSmallProp(tag, placement, buildBenchProp, {
            shade: 1.6,
            shadeA: 0.2,
          });
          break;
        case `logSeat`:
          build.buildSmallProp(tag, placement, buildLogSeatProp, {
            shade: 1.5,
            shadeA: 0.2,
          });
          break;
        case `lamp`:
          buildVillageLamp(build, placement, tag);
          break;
        case `signpost`:
          build.buildSmallProp(tag, placement, buildSignpostProp, {
            shade: 2.4,
            shadeA: 0.2,
          });
          break;
        case `mailbox`:
          build.buildSmallProp(tag, placement, buildMailboxProp, {});
          break;
        case `barrel`:
          build.buildSmallProp(tag, placement, buildBarrelProp, {
            shade: 2,
            shadeA: 0.25,
          });
          break;
        case `washingLine`:
          build.buildSmallProp(tag, placement, buildWashingLineProp, {});
          break;
        case `crateStack`:
          buildVillageCrateStack(build, placement, tag);
          break;
        case `sackPile`:
          build.buildSmallProp(
            tag,
            placement,
            (values7, value20) => {
              buildSackProp(values7, value20);
              values7.push(0.55, 0, 0.15, 0, 0.8, 0);
              buildSackProp(values7, value20);
              values7.pop();
              values7.push(0.25, 0.48, 0.08, 0.3, 0.3, 0.2);
              buildSackProp(values7, value20);
              values7.pop();
              values7.push(-0.6, 0, 0.1);
              buildCrateProp(values7, value20, {
                s: 0.6,
                ry: 0.2,
              });
              values7.pop();
              return {
                radius: 0.9,
                colliders: [
                  {
                    x: 0.27,
                    z: 0.07,
                    radius: 0.58,
                    h: 0.95,
                    noTop: true,
                  },
                  {
                    x: -0.6,
                    z: 0.1,
                    radius: 0.36,
                    h: 0.6,
                  },
                ],
              };
            },
            {
              foot: 0.5,
              shade: 2,
              shadeA: 0.22,
            },
          );
          break;
        case `pathSteps`:
          build.buildSmallProp(tag, placement, buildPathStepsProp, {
            mode: `min`,
            foot: 0.2,
          });
          break;
        case `rocks`:
          build.buildSmallProp(tag, placement, buildRockClusterProp, {
            mode: `min`,
            foot: 0.6,
            aoMin: 0.8,
            shade: 2.6,
            shadeA: 0.28,
          });
      }
    } catch (result19) {
      console.warn(`[props] failed to build`, placement.type, result19);
    }
  });
}
