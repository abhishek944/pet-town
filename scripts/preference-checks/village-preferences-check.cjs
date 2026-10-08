const Module = require("node:module");
const listeners = {};
let resolvePreferences;
const initial = { revision: 2, preferences: { marker: "initial" } };
const applied = { revision: 1, preferences: { marker: "applied" } };
const stale = { revision: 0, preferences: { marker: "stale" } };
const later = { revision: 3, preferences: { marker: "later" } };
const originalLoad = Module._load;
Module._load = (request, parent, main) => {
  if (request === "@tauri-apps/api/event")
    return {
      listen: async (name, callback) => {
        listeners[name] = callback;
        return () => {};
      },
    };
  if (request === "@tauri-apps/api/core")
    return {
      invoke: (command) =>
        new Promise((resolve) => {
          if (command === "get_preferences") resolvePreferences = resolve;
        }),
    };
  return originalLoad(request, parent, main);
};
const { installVillagePreferences } = require("./village-preferences.cjs");
function assert(value, message) {
  if (!value) throw new Error(message);
}
(async () => {
  const seenPreferences = [];
  let paused = false;
  const renderer = {
    setPreferences: (value) => seenPreferences.push(value.marker),
    setPaused: (value) => {
      paused = value;
    },
  };
  const installing = installVillagePreferences(
    renderer,
    () => {
      paused = true;
    },
    () => {
      paused = false;
    },
  );
  await new Promise(setImmediate);
  assert(
    listeners["village-pause"] && listeners["preferences-applied"],
    "listeners were not installed before the initial snapshot",
  );
  listeners["village-pause"]();
  listeners["preferences-applied"]({ payload: applied });
  listeners["preferences-applied"]({ payload: stale });
  resolvePreferences(initial);
  await installing;
  listeners["preferences-applied"]({ payload: later });
  assert(paused, "startup snapshot overrode a newer pause event");
  assert(
    seenPreferences.join(",") === "applied,initial,later",
    "village did not select preference snapshots by revision",
  );
  console.log("preference event ordering checks: pass");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
