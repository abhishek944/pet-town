import { OCEAN_PLACES } from "./layout.js";
import { createMarineWildlife } from "./wildlife/index.js";
import { createOceanScenery } from "./scenery/index.js";
import { createSwimmingBubbles } from "./swimming/bubbles.js";
import { createOceanProgress } from "./activities/progress.js";
import { createOceanNavigation } from "./activities/navigation.js";

/** Water owns its exploration as well as its surface rendering. */
export function createWaterExploration() {
  let runtime;
  return {
    id: "water-exploration",
    init(context) {
      if (!context.terrain.ocean || context.params.has("waterTest")) return;
      let error = "";
      const progress = createOceanProgress((message) => {
        if (message && message !== error) context.hud?.toast(message);
        error = message;
      });
      const scenery = createOceanScenery(context);
      const wildlife = createMarineWildlife(context);
      const bubbles = createSwimmingBubbles(context);
      const navigation = createOceanNavigation(context);
      const api = {
        get places() {
          return context.boats ? [...OCEAN_PLACES, context.boats.place] : OCEAN_PLACES;
        },
        get discoveries() {
          return [...progress.state.stamps];
        },
        get available() {
          return progress.available;
        },
        get error() {
          return error;
        },
        get headingId() {
          return navigation.headingId;
        },
        setHeading: (id) => navigation.setHeading(id),
        area: context.terrain.ocean,
      };
      context.water.exploration = api;
      runtime = { scenery, wildlife, bubbles, navigation, progress, api, nextCheck: 0 };
    },
    update(dt, context) {
      if (!runtime) return;
      runtime.navigation.update();
      if (document.hidden || context.paused) return;
      runtime.scenery.update(dt);
      runtime.wildlife.update(dt);
      runtime.bubbles.update(dt);
      const persistence = context.building?.persistence;
      if (
        (persistence?.on && !persistence.loaded) ||
        context.hud?.blocking ||
        context.hud?.photoMode ||
        !runtime.progress.available ||
        context.time < runtime.nextCheck
      )
        return;
      runtime.nextCheck = context.time + 1;
      const p = context.player.position;
      const surface = context.water.sample(p.x, p.z);
      const body = context.player.body;
      for (const place of OCEAN_PLACES) {
        if (
          runtime.progress.state.stamps.includes(place.id) ||
          Math.hypot(place.x - p.x, place.z - p.z) > place.radius
        )
          continue;
        const found =
          place.id === "island"
            ? body.onGround && context.terrain.topY(p.x, p.z) > surface
            : body.swimming &&
              context.water.isWater(p.x, p.z) &&
              (place.id === "lagoon" || p.y + 1.1 < surface - 0.2);
        if (found && runtime.progress.stamp(place.id))
          context.hud?.toast(
            `Discovered ${place.name} · ${runtime.progress.state.stamps.length}/5`,
          );
      }
    },
    dispose(context) {
      if (!runtime) return;
      runtime.navigation.dispose();
      runtime.bubbles.dispose();
      runtime.wildlife.dispose();
      runtime.scenery.dispose();
      if (context.water.exploration === runtime.api) delete context.water.exploration;
      runtime = null;
    },
  };
}
