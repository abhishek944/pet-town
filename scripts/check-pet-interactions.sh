#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TMP=$(mktemp -d "${TMPDIR:-/tmp}/pet-village-interactions.XXXXXX")
trap 'rm -rf "$TMP"' EXIT INT TERM
cd "$ROOT"
grep -q 'dispatchEvent(new Event("citizen-hidden", { bubbles: true }))' src/renderer.ts

npx esbuild src/pet-interactions.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/pet-interactions.cjs"
cat > "$TMP/check.cjs" <<'CHECK'
class FakeElement {
  constructor(className = "", parent = null) {
    this.tag = "";
    this.className = className;
    this.parent = parent;
    this.children = [];
    this.dataset = {};
    this.listeners = new Map();
    this.style = {};
    this.offsetWidth = 80;
    this.offsetHeight = 30;
    this.classList = { contains: (name) => this.className.split(" ").includes(name) };
  }
  closest(selector) {
    if (this.className.split(" ").includes(selector.slice(1))) return this;
    return this.parent?.closest(selector) ?? null;
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
  append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
  contains(target) { return target === this || this.children.some((child) => child.contains(target)); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); }
  setAttribute() {}
  setPointerCapture() {}
  focus() { global.focusedElement = this; }
  getBoundingClientRect() { return { left: 20, bottom: 60 }; }
  querySelector(selector) { return this.children.find((child) => child.tag === selector) ?? null; }
  querySelectorAll(selector) {
    const own = this.className.split(" ").includes(selector.slice(1)) ? [this] : [];
    return own.concat(...this.children.map((child) => child.querySelectorAll(selector)));
  }
}
global.Node = FakeElement;
global.Element = FakeElement;
global.window = { innerWidth: 500, innerHeight: 150 };
function makeElement(tag) { const element = new FakeElement(); element.tag = tag; return element; }
global.document = {
  createElement: (tag) => makeElement(tag),
  createElementNS: (_namespace, tag) => makeElement(tag),
};
const { installPetInteractions } = require("./pet-interactions.cjs");
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = new FakeElement("village");
const citizen = new FakeElement("citizen", root);
root.children.push(citizen);
citizen.dataset.agentId = "agent-1";
const pet = new FakeElement("pet", citizen);
const calls = [];
const dispose = installPetInteractions(root, {
  actionsFor: () => [{ id: "wave", label: "Wave" }],
  startAction: (id, action) => { calls.push(["action", id, action]); return true; },
  openPreferences: (id) => calls.push(["preferences", id]),
  beginDrag: (id, x) => { calls.push(["begin", id, x]); return true; },
  moveDrag: (id, x) => calls.push(["move", id, x]),
  endDrag: (id) => calls.push(["end", id]),
  geometryChanged: () => calls.push(["geometry"]),
});
const fire = (type, event) => root.listeners.get(type)(event);
let ordinaryClicksStopped = 0;
for (let detail = 1; detail <= 2; detail += 1) {
  fire("click", {
    detail,
    target: pet,
    preventDefault() { ordinaryClicksStopped += 1; },
    stopImmediatePropagation() { ordinaryClicksStopped += 1; },
  });
}
assert(ordinaryClicksStopped === 0, "ordinary rapid clicks were swallowed");
fire("pointerdown", { button: 0, pointerId: 7, clientX: 20, target: pet });
fire("pointermove", { pointerId: 7, clientX: 22, target: pet, preventDefault() {} });
assert(!calls.some(([name]) => name === "begin"), "sub-threshold move started dragging");
fire("pointermove", { pointerId: 7, clientX: 30, target: pet, preventDefault() {} });
fire("pointerup", { pointerId: 7, target: pet, preventDefault() {} });
assert(calls.some(([name]) => name === "begin"), "drag did not begin");
assert(calls.some(([name]) => name === "move"), "drag position was not updated");
assert(calls.some(([name]) => name === "end"), "drag did not end");
let clickStopped = false;
fire("click", { preventDefault() {}, stopImmediatePropagation() { clickStopped = true; } });
assert(clickStopped, "normal post-drag click was not suppressed");
const endedDrags = calls.filter(([name]) => name === "end").length;
fire("pointerdown", { button: 0, pointerId: 9, clientX: 20, target: pet });
fire("pointermove", { pointerId: 9, clientX: 30, target: pet, preventDefault() {} });
fire("citizen-hidden", { target: citizen });
assert(calls.filter(([name]) => name === "end").length === endedDrags + 1, "hidden pet retained an active drag");
clickStopped = false; fire("click", { preventDefault() {}, stopImmediatePropagation() { clickStopped = true; } });
assert(clickStopped, "hidden-drag click was not suppressed");
fire("pointerdown", { button: 0, pointerId: 10, clientX: 20, target: pet });
fire("pointermove", { pointerId: 10, clientX: 30, target: pet, preventDefault() {} });
fire("village-pause", { target: root });
assert(calls.filter(([name]) => name === "end").length === endedDrags + 2, "Settings pause retained an active drag");
clickStopped = false; fire("click", { preventDefault() {}, stopImmediatePropagation() { clickStopped = true; } });
assert(clickStopped, "paused-drag click was not suppressed");
let contextPrevented = false;
fire("contextmenu", { target: pet, clientX: 480, clientY: 145, preventDefault() { contextPrevented = true; } });
assert(contextPrevented, "pet context menu did not replace the system menu");
const menu = root.children.find((child) => child.className === "pet-menu");
assert(menu && menu.style.left === "416px" && menu.style.top === "116px", "menu was not clamped to the window");
const waveButton = menu.children[0];
assert(waveButton.tag === "button" && waveButton.children.length === 2, "menu action lost its icon or label");
assert(waveButton.children[0].tag === "svg" && waveButton.children[0].children.length > 0, "menu action has no icon paths");
assert(waveButton.children[1].tag === "span" && waveButton.children[1].textContent === "Wave", "menu action label is wrong");
menu.children[0].listeners.get("click")();
assert(calls.some(([name, id, action]) => name === "action" && id === "agent-1" && action === "wave"), "menu action was not invoked");
assert(!root.children.includes(menu), "menu did not close after action");
fire("contextmenu", { target: pet, clientX: 200, clientY: 80, preventDefault() {} });
const preferencesMenu = root.children.find((child) => child.className === "pet-menu");
const preferencesButton = preferencesMenu.children[2];
assert(preferencesButton.children.length === 2, "preferences option lost its icon or label");
assert(preferencesButton.children[0].tag === "svg" && preferencesButton.children[0].children.length > 0, "preferences option has no icon paths");
assert(preferencesButton.children[1].textContent === "Preferences…", "preferences label is wrong");
preferencesButton.listeners.get("click")();
assert(calls.some(([name, id]) => name === "preferences" && id === "agent-1"), "preferences command was not invoked");
fire("contextmenu", { target: pet, clientX: 200, clientY: 80, preventDefault() {} });
fire("citizen-hidden", { target: citizen });
assert(!root.children.some((child) => child.className === "pet-menu" || child.className === "pet-menu-backdrop"), "hidden pet left an interactive menu behind");
fire("contextmenu", { target: pet, clientX: 200, clientY: 80, preventDefault() {} });
const backdrop = root.children.find((child) => child.className === "pet-menu-backdrop");
assert(backdrop, "menu backdrop was not created");
fire("pointerdown", { button: 0, pointerId: 8, clientX: 5, target: backdrop });
assert(!root.children.includes(backdrop), "outside click did not close the menu backdrop");
assert(!root.children.some((child) => child.className === "pet-menu"), "outside click did not close the menu");
dispose();
assert(root.listeners.size === 0, "interaction listeners were not disposed");
console.log("pet interaction checks: pass");
CHECK
node "$TMP/check.cjs"
