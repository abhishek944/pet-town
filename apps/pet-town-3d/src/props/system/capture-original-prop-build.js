import { propsState } from "../state.js";

/** Retain the deterministic factory state and effects belonging to one original. */
export function captureOriginalPropBuild(build, tag) {
  const runtime = propsState.propsRuntime;
  const seed = {
    random: build.random.s,
    builder: build.builder.rng.s,
    placementCount: build.placementCount,
    fireCount: build.fireIndex ?? runtime.fires.length,
  };
  const counts = Object.fromEntries(
    ["smokes", "fires", "blades", "statics"].map((key) => [key, runtime[key].length]),
  );
  return () => {
    const record = runtime.recs.get(tag);
    if (!record?.it.terrainSupport) return;
    record.buildSeed = seed;
    for (const key of Object.keys(counts)) record[key] = runtime[key].slice(counts[key]);
  };
}
