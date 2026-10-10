const {
  applyFlowSample,
  ASSET_READY_TIMEOUT_MS,
  distanceWhileAssetPending,
  setPreferenceHidden,
  createCitizenElement,
  updateCitizenElement,
  STATUS_LABELS,
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
class FakePet {
  constructor() {
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
class FakeLoader {
  static pending = [];
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    FakeLoader.pending.push(this);
  }
  decode() {
    return this.promise;
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
class FakeBadgeElement {
  constructor(tag) {
    this.tag = tag;
    this.className = "";
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.hidden = false;
    this.title = "";
    this.textContent = "";
  }
  append(...children) {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  querySelector(selector) {
    const name = selector.startsWith(".") ? selector.slice(1) : selector;
    for (const child of this.children) {
      if (child.className.split(" ").includes(name)) return child;
      const nested = child.querySelector(selector);
      if (nested) return nested;
    }
    return null;
  }
}
global.document = {
  createElement: (tag) => new FakeBadgeElement(tag),
};
function checkStatusBadge() {
  const citizen = createCitizenElement();
  const label = "a-long-assigned-agent-name-that-keeps-its-full-tooltip";
  updateCitizenElement(citizen, {
    id: "session:w1:p2",
    sprite: "cat",
    source: "herdr",
    status: "blocked",
    label,
    retiring: false,
    doneSinceMs: null,
  });
  const project = citizen.querySelector(".project");
  assert(project?.title.includes(label), "badge tooltip truncated the full agent name");
  assert(citizen.querySelector(".project-name")?.textContent === label, "badge lost the full name");
  assert(
    citizen.querySelector(".project-status")?.textContent === "Needs reply",
    "blocked badge label is wrong",
  );
  assert(citizen.dataset.status === "blocked", "blocked badge color state is missing");
  updateCitizenElement(citizen, {
    id: "session:w1:p2",
    sprite: "cat",
    source: "herdr",
    status: "unrecognized",
    label,
    retiring: false,
    doneSinceMs: null,
  });
  assert(
    citizen.querySelector(".project-status")?.textContent === "Unknown",
    "unknown state fallback is wrong",
  );
  assert(STATUS_LABELS.idle === "Ready", "ready label is wrong");
  assert(
    citizen.attributes["aria-label"].includes("Unknown"),
    "badge accessibility label omitted status",
  );
}
const timers = [];
global.setTimeout = (callback, milliseconds) => {
  const timer = { callback, milliseconds, active: true };
  timers.push(timer);
  return timer;
};
global.clearTimeout = (timer) => {
  timer.active = false;
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
  const element = { dataset: {}, hidden: false, querySelector: () => pet };
  assert(!applyFlowSample(element, sample(1, 1)), "undecoded first asset was ready");
  FakeLoader.pending.shift().resolve();
  await new Promise(setImmediate);
  assert(applyFlowSample(element, sample(1, 1)), "decoded first asset was not ready");
  assert(pet.style.getPropertyValue("--clip-scale") === "1", "first scale was not committed");
  setPreferenceHidden(element, true);
  assert(element.hidden, "preference did not hide a flow-visible citizen");
  applyFlowSample(element, sample(1, 1));
  assert(element.hidden, "flow update overrode preference-hidden visibility");
  setPreferenceHidden(element, false);
  assert(!element.hidden, "clearing preference hide did not restore a flow-visible citizen");
  assert(!applyFlowSample(element, sample(2, 2)), "new clip epoch did not restart loading");
  assert(pet.style.getPropertyValue("--clip-scale") === "1", "presentation changed before decode");
  FakeLoader.pending.shift().resolve();
  await new Promise(setImmediate);
  assert(applyFlowSample(element, sample(2, 2)), "restarted clip was not ready");
  assert(pet.srcAssignments === 2, "same-URL clip action did not restart the image");
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
  assert(pet.src === "work.png", "late matching decode did not commit atomically");
  assert(!applyFlowSample(element, sample(4, 1.7, true, "bad.png")), "new bad asset was ready");
  assert(
    pet.style.getPropertyValue("--clip-scale") === "1.7",
    "failed asset metadata leaked early",
  );
  FakeLoader.pending.shift().reject(new Error("decode failed"));
  await new Promise(setImmediate);
  assert(applyFlowSample(element, sample(4, 1.7, true, "bad.png")), "decode failure stalled flow");
  assert(pet.hidden, "decode failure left stale artwork visible");
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
  assert(pet.src !== "stale.png", "stale decode replaced the latest request");
  fireLatestTimer();
  assert(applyFlowSample(element, latest), "latest timeout did not release flow");
  latestLoader.resolve();
  await new Promise(setImmediate);
  assert(pet.src === "latest.png", "latest late decode did not commit");
  checkStatusBadge();
  console.log("renderer asset transition and status badge checks: pass");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
