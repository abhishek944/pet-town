const { SettingsStartupBuffer } = require(process.argv[2]);
const buffer = new SettingsStartupBuffer();
const seen = [];
buffer.receiveSnapshot({ revision: 2, value: "reloaded" }, (item) =>
  seen.push(`snapshot:${item.value}`),
);
buffer.receiveSnapshot({ revision: 1, value: "stale" }, (item) =>
  seen.push(`snapshot:${item.value}`),
);
buffer.receiveSelection("new-pet", (value) => seen.push(`selection:${value}`));
buffer.finish({ revision: 0, value: "initial" }, "old-pet", (item, selection) =>
  seen.push(`finish:${item.value}:${selection}`),
);
buffer.receiveSnapshot({ revision: 3, value: "later" }, (item) =>
  seen.push(`snapshot:${item.value}`),
);
buffer.receiveSelection("later-pet", (value) => seen.push(`selection:${value}`));
if (seen.join(",") !== "finish:reloaded:new-pet,snapshot:later,selection:later-pet")
  throw new Error("Settings startup event buffering lost, regressed, or reordered state");
const reverse = new SettingsStartupBuffer();
let newest;
reverse.receiveSnapshot({ revision: 1, value: "event" }, () => {});
reverse.finish({ revision: 2, value: "command" }, "pet", (item) => {
  newest = item.value;
});
if (newest !== "command") throw new Error("Settings startup preferred an older event snapshot");
console.log("settings startup event checks: pass");
