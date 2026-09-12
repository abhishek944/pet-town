#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TMP=$(mktemp -d "${TMPDIR:-/tmp}/herdr-pets-focus.XXXXXX")
trap 'rm -rf "$TMP"' EXIT INT TERM
cd "$ROOT"

npx esbuild src/pet-focus.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/pet-focus.cjs"
cat > "$TMP/check.cjs" <<'CHECK'
class FakeElement {
  constructor(classes = [], parent = null, agentId = null) {
    this.classes = new Set(classes);
    this.parent = parent;
    this.dataset = agentId ? { agentId } : {};
    this.classList = { contains: (name) => this.classes.has(name) };
  }
  closest(selector) {
    if (this.classes.has(selector.slice(1))) return this;
    return this.parent?.closest(selector) ?? null;
  }
}
global.Element = FakeElement;
const { agentIdForPetClick, installPetFocus } = require("./pet-focus.cjs");
function assert(condition, message) { if (!condition) throw new Error(message); }
const citizen = new FakeElement(["citizen"], null, "session:w1:p2");
const pet = new FakeElement(["pet"], citizen);
const label = new FakeElement(["project"], citizen);
assert(agentIdForPetClick(pet) === "session:w1:p2", "pet did not resolve its agent");
assert(agentIdForPetClick(label) === "session:w1:p2", "label did not focus its pane");
const status = new FakeElement(["project-status"], label);
assert(agentIdForPetClick(status) === "session:w1:p2", "nested status did not focus its pane");
assert(agentIdForPetClick(citizen) === null, "empty citizen area captured clicks");
citizen.hidden = true;
assert(agentIdForPetClick(pet) === null, "hidden citizen captured clicks");
citizen.hidden = false;
citizen.classes.add("retiring");
assert(agentIdForPetClick(label) === null, "departing citizen captured clicks");
citizen.classes.delete("retiring");
assert(agentIdForPetClick(null) === null, "null target resolved an agent");
let listener = null;
const root = {
  addEventListener(type, next) { if (type === "click") listener = next; },
  removeEventListener(type, next) { if (type === "click" && listener === next) listener = null; },
};
const focused = [];
const settle = () => new Promise(setImmediate);
(async () => {
  const dispose = installPetFocus(root, (id) => { focused.push(id); });
  for (const target of [label, pet, status]) {
    listener({ target });
    assert(citizen.dataset.focusPending === "true", "pending click was not recorded");
    listener({ target });
    await settle();
    assert(!citizen.dataset.focusPending, "pending state did not clear");
  }
  assert(JSON.stringify(focused) === JSON.stringify(Array(3).fill("session:w1:p2")), "pet and badge routing or duplicate prevention failed");
  dispose();
  assert(listener === null, "click listener was not removed");
  let attempts = 0;
  installPetFocus(root, () => { if (++attempts === 1) throw new Error("agent exited"); });
  listener({ target: label });
  await settle();
  assert(citizen.dataset.focusError === "true", "focus failure was hidden");
  listener({ target: pet });
  await settle();
  assert(!citizen.dataset.focusError && attempts === 2, "failed focus could not be retried");
  console.log("pet focus checks: pass");
})().catch((error) => { console.error(error); process.exitCode = 1; });
CHECK
node "$TMP/check.cjs"
