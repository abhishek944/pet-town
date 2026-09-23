let canvas = null;
const image = {
  hidden: false,
  complete: true,
  naturalWidth: 320,
  naturalHeight: 320,
  className: "pet clip-source-right",
  dataset: { assetKey: "sleep:1", assetReadyKey: "sleep:1" },
  style: { opacity: "", getPropertyValue: () => "1" },
  insertAdjacentElement: (_where, value) => {
    canvas = value;
  },
};
const element = { querySelector: (selector) => (selector.startsWith("img") ? image : canvas) };
global.document = {
  createElement: () => ({
    className: "",
    dataset: {},
    style: { setProperty() {} },
    setAttribute() {},
    getContext: () => ({ drawImage() {} }),
    remove() {
      canvas = null;
    },
  }),
};
const { freezePetFrame, unfreezePetFrame } = require("./pet-freeze.cjs");
freezePetFrame(element);
if (!canvas || image.style.opacity !== "0" || canvas.width !== 320)
  throw new Error("pet frame did not freeze without preserving the image hit target");
const sleepingCanvas = canvas;
image.dataset.assetKey = "wave:2";
freezePetFrame(element);
if (canvas !== sleepingCanvas)
  throw new Error("pending replacement discarded the last ready frozen frame");
image.dataset.assetReadyKey = "wave:2";
freezePetFrame(element);
if (canvas === sleepingCanvas || canvas.dataset.freezeKey !== "wave:2:pet clip-source-right")
  throw new Error("decoded replacement did not refresh the paused frozen frame");
unfreezePetFrame(element);
if (canvas || image.style.opacity !== "") throw new Error("pet frame did not resume");
console.log("preference freeze checks: pass");
