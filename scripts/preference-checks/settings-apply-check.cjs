const { mergeAppliedDraft, settingsMessage, shouldShowApplyError } = require(process.argv[2]);
const submitted = { app: { value: 1 }, pets: {} };
const applied = { preferences: { app: { value: 1 }, pets: {} } };
const newer = { app: { value: 2 }, pets: {} };
if (mergeAppliedDraft(newer, submitted, applied).draft !== newer)
  throw new Error("Apply discarded newer draft edits");
if (mergeAppliedDraft(submitted, submitted, applied).draft === submitted)
  throw new Error("Apply did not install its saved draft");
if (settingsMessage("new failure", "old warning") !== "new failure old warning")
  throw new Error("Apply status messages were not combined");
if (shouldShowApplyError(2, 2, 1, 0))
  throw new Error("superseded baseline exposed a stale Apply conflict");
if (!shouldShowApplyError(2, 2, 0, 0)) throw new Error("current Apply failure was hidden");
console.log("settings Apply merge checks: pass");
