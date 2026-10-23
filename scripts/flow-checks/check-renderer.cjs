const {
  applyFlowSample,
  ASSET_READY_TIMEOUT_MS,
  distanceWhileAssetPending,
  setPreferenceHidden,
} = require("./renderer-view.cjs");
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
class FakeStyle {
  constructor() {
    this.values = new Map();
  }
  getPropertyValue(key) {
    return this.values.get(key) ?? "";
  }
  setProperty(key, value) {
    this.values.set(key, value);
  }
}
class FakePet extends EventTarget {
  constructor() {
    super();
    this.className = "pet";
    this.dataset = {};
    this.hidden = true;
    this.style = new FakeStyle();
    this.source = "";
    this.srcAssignments = 0;
  }
  getAttribute(name) {
    return name === "src" && this.source ? this.source : null;
  }
  removeAttribute(name) {
    if (name === "src") this.source = "";
  }
  get src() {
    return this.source;
  }
  set src(value) {
    this.source = value;
    this.srcAssignments += 1;
  }
}
class FakeLoader extends FakePet {
  static pending = [];
  constructor() {
    super();
    FakeLoader.pending.push(this);
  }
  resolve() {
    this.naturalWidth = this.naturalHeight = 16;
    this.dispatchEvent(new Event("load"));
  }
  reject() {
    this.dispatchEvent(new Event("error"));
  }
  decode() {
    throw new Error("Renderer readiness must not call Image.decode()");
  }
}
global.Image = FakeLoader;
const clip = (scale, assetUrl = "walk.png") => ({
  name: "walk",
  durationMs: 100,
  role: "locomotion",
  assetUrl,
  holdAssetUrl: "done.png",
  sourceFacing: "right",
  mirror: true,
  scale,
});
const sample = (epoch, scale, moving = true, assetUrl = "walk.png") => ({
  state: "working",
  clip: clip(scale, assetUrl),
  clipElapsedMs: 0,
  clipEpoch: epoch,
  moving,
  speedPxPerSecond: moving ? 20 : 0,
  visible: true,
  held: false,
  failed: false,
});
const timers = [];
global.setTimeout = (callback, milliseconds) => {
  const timer = { callback, milliseconds, active: true };
  timers.push(timer);
  return timer;
};
global.clearTimeout = (timer) => {
  if (timer) timer.active = false;
};
const fireLatestTimer = () => {
  const timer = timers.findLast((candidate) => candidate.active);
  assert(timer, "no active asset-release timer");
  timer.active = false;
  timer.callback();
  return timer;
};
(async () => {
  const pet = new FakePet();
  const element = {
    dataset: {},
    hidden: false,
    querySelector: (selector) => (selector === "img.pet" ? pet : null),
  };
  assert(!applyFlowSample(element, sample(1, 1)), "unloaded first asset was ready");
  const firstLoader = FakeLoader.pending.shift();
  assert(firstLoader.decoding === "sync", "preparation enabled asynchronous decode");
  firstLoader.resolve();
  await new Promise(setImmediate);
  assert(firstLoader.src === "", "completed temporary source was not retired");
  assert(applyFlowSample(element, sample(1, 1)), "loaded first asset was not ready");
  assert(pet.style.getPropertyValue("--clip-scale") === "1", "first scale was not committed");
  assert(pet.src === "walk.png" && !element.hidden, "loaded first asset was not shown");
  setPreferenceHidden(element, true);
  assert(element.hidden, "preference did not hide a flow-visible citizen");
  applyFlowSample(element, sample(1, 1));
  assert(element.hidden, "flow update overrode preference-hidden visibility");
  assert(pet.src === "" && pet.hidden, "preference hide did not retire the image source");
  setPreferenceHidden(element, false);
  assert(element.hidden, "clearing preference hide revealed an unprepared image");
  assert(!applyFlowSample(element, sample(1, 1)), "retired source was ready without preparation");
  FakeLoader.pending.shift().resolve();
  await new Promise(setImmediate);
  assert(!element.hidden && pet.src === "walk.png", "matching reload did not restore visibility");
  const assignments = pet.srcAssignments;
  assert(applyFlowSample(element, sample(2, 2)), "cached epoch unnecessarily awaited a load");
  assert(FakeLoader.pending.length === 0, "cached epoch created another preparation");
  assert(pet.srcAssignments === assignments + 1, "same-URL epoch did not restart the image");
  assert(
    pet.style.getPropertyValue("--clip-scale") === "2",
    "new scale was not committed atomically",
  );
  assert(applyFlowSample(element, sample(2, 2, false)), "wait changed asset readiness");
  assert(
    pet.className.includes("flow-stationary"),
    "wait did not preserve image with stationary metadata",
  );
  const pending = sample(3, 1.7, true, "work.png");
  assert(!applyFlowSample(element, pending), "new pending asset was ready");
  assert(pet.style.getPropertyValue("--clip-scale") === "2", "pending metadata leaked early");
  assert(distanceWhileAssetPending(pending, 250) === 5, "pending move lost horizontal travel");
  assert(
    distanceWhileAssetPending(sample(3, 1.7, false), 250) === 0,
    "pending wait gained movement",
  );
  const releaseTimer = fireLatestTimer();
  assert(
    releaseTimer.milliseconds === ASSET_READY_TIMEOUT_MS,
    "asset timeout changed unexpectedly",
  );
  assert(applyFlowSample(element, pending), "asset timeout did not release logical flow");
  assert(pet.src === "walk.png", "asset timeout replaced the last ready artwork");
  FakeLoader.pending.shift().resolve();
  await new Promise(setImmediate);
  assert(pet.src === "work.png", "late matching load did not commit atomically");
  assert(!applyFlowSample(element, sample(4, 1.7, true, "bad.png")), "new bad asset was ready");
  assert(
    pet.style.getPropertyValue("--clip-scale") === "1.7",
    "failed asset metadata leaked early",
  );
  FakeLoader.pending.shift().reject();
  await new Promise(setImmediate);
  assert(applyFlowSample(element, sample(4, 1.7, true, "bad.png")), "load failure stalled flow");
  assert(pet.hidden, "load failure left stale artwork visible");
  const stale = sample(5, 1, true, "stale.png");
  assert(!applyFlowSample(element, stale), "stale request began ready");
  const staleLoader = FakeLoader.pending.shift();
  const staleTimer = timers.findLast((timer) => timer.active);
  const latest = sample(6, 1, true, "latest.png");
  assert(!applyFlowSample(element, latest), "latest request began ready");
  const latestLoader = FakeLoader.pending.shift();
  staleTimer.callback();
  assert(!applyFlowSample(element, latest), "stale timeout released the latest request");
  staleLoader.resolve();
  await new Promise(setImmediate);
  assert(pet.src !== "stale.png", "stale load replaced the latest request");
  fireLatestTimer();
  assert(applyFlowSample(element, latest), "latest timeout did not release flow");
  latestLoader.resolve();
  await new Promise(setImmediate);
  assert(pet.src === "latest.png", "latest late load did not commit");
  console.log("renderer asset transition checks: pass");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
