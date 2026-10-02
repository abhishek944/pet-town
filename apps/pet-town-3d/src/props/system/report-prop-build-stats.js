/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */

import { propsState } from "../state.js";
export function reportPropBuildStats(build) {
  build.elapsedMs = Math.round(performance.now() - build.startedAt);
  build.triangleCount = 0;
  build.staticGroup.traverse((isMeshValue) => {
    if (isMeshValue.isMesh) {
      build.triangleCount += isMeshValue.geometry.attributes.position.count / 3;
    }
  });
  build.segmentCount = propsState.propColliders.filter(
    (kindValue2) => kindValue2.kind === `segment`,
  ).length;
  console.info(
    `[props] built ${propsState.propEntries.length} props, ${propsState.propColliders.length} colliders (${build.segmentCount} segments), ${propsState.propsRuntime.walk.length} walk rects, ${build.staticGroup.children.length} static meshes, ${Math.round(build.triangleCount / 1e3)}k tris in ${build.elapsedMs}ms`,
  );
}
