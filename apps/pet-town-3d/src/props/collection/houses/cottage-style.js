import { createBeveledPropBox } from "../../geometry/create-beveled-prop-box.js";
export function block(b, kind, w, h, d, x, y, z, tint, more = {}) {
  b.add(kind, createBeveledPropBox(w, h, d, Math.min(0.07, w / 5, h / 5, d / 5)), {
    x,
    y,
    z,
    tint,
    ...more,
  });
}
