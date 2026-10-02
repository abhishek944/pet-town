/** Windmill tower and separately animated sail geometry. */

import { propsState } from "../state.js";
import { createBeveledPropBox } from "../geometry/create-beveled-prop-box.js";
import { extrudePropShape } from "../geometry/extrude-prop-shape.js";
import { createArchedPropShape } from "../geometry/create-arched-prop-shape.js";
export function buildWindmillWindows(windmill) {
  windmill.appendWindow = (value7, value8, value9, value10) => {
    windmill.builder.push(
      Math.sin(value8) * (windmill.wallFaceRadius(value7) + 0.01),
      value7,
      Math.cos(value8) * (windmill.wallFaceRadius(value7) + 0.01),
      -windmill.wallTilt,
      value8,
      0,
    );
    windmill.builder.add(
      `glass`,
      extrudePropShape(createArchedPropShape(value9, value10, value9 / 2), 0.08, 0, 10),
      {
        y: -value10 / 2,
        uv: {
          mode: `unit`,
        },
        noAO: true,
      },
    );
    let archedPropShapeResult2 = createArchedPropShape(
      value9 + 0.26,
      value10 + 0.13,
      (value9 + 0.26) / 2,
    );
    archedPropShapeResult2.holes.push(createArchedPropShape(value9, value10, value9 / 2));
    windmill.builder.add(`paint`, extrudePropShape(archedPropShapeResult2, 0.14, 0.02, 10), {
      y: -value10 / 2,
      z: 0.04,
      tint: propsState.propPalette.trim,
    });
    windmill.builder.add(`wood`, createBeveledPropBox(value9 + 0.36, 0.09, 0.26, 0.03), {
      y: -value10 / 2 - 0.06,
      z: 0.1,
      tint: propsState.propPalette.timber,
    });
    windmill.builder.pop();
  };
  windmill.appendWindow(4.2, 0, 0.62, 0.95);
  windmill.appendWindow(2.2, Math.PI / 2, 0.55, 0.85);
  windmill.appendWindow(2.2, -Math.PI / 2, 0.55, 0.85);
  windmill.appendWindow(4.9, Math.PI * 0.75, 0.5, 0.8);
  windmill.appendWindow(4.9, -Math.PI * 0.75, 0.5, 0.8);
  windmill.metadata.windows = [
    {
      x: windmill.wallFaceRadius(2.2) + 0.1,
      y: 2.2,
      z: 0,
      nx: 1,
      nz: 0,
    },
    {
      x: -windmill.wallFaceRadius(2.2) - 0.1,
      y: 2.2,
      z: 0,
      nx: -1,
      nz: 0,
    },
  ];
}
