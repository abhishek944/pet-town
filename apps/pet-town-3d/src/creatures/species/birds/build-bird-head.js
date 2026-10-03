import { buildHushHead } from "./build-hush-head.js";
import { createCreatureBone } from "../../rig-builders/create-creature-bone.js";
import { createCreatureEllipsoidGeometry } from "../../geometry/create-creature-ellipsoid-geometry.js";
import { colorCreatureGeometryVertices } from "../../geometry/color-creature-geometry-vertices.js";
import { getCreatureColor } from "../../geometry/get-creature-color.js";
import { fillCreatureGeometryColor } from "../../geometry/fill-creature-geometry-color.js";
import { transformCreatureGeometry } from "../../geometry/transform-creature-geometry.js";
import { addCreatureBoneMesh } from "../../rig-builders/add-creature-bone-mesh.js";
import { mergeCreatureGeometries } from "../../geometry/merge-creature-geometries.js";
import { buildCreatureFace } from "../../faces/build-creature-face.js";
import { createBirdFeather } from "./create-bird-feather.js";

export function buildBirdHead(body, palette, materials, kind) {
  if (kind === "hush") return buildHushHead(body, palette, materials);
  const head = createCreatureBone("head", body, [0, 0.56, 0.065]);
  const surface = { center: [0, 0, 0], radii: [0.275, 0.275, 0.245] };
  const dome = createCreatureEllipsoidGeometry(...surface.radii, 28, 20);
  colorCreatureGeometryVertices(dome, (color, position, normal) => {
    const throat =
      kind === "skim"
        ? Math.max(0, Math.min(1, (-position.y + 0.04) * 12)) * Math.max(0, normal.z)
        : 0;
    color.copy(getCreatureColor(palette.back)).lerp(getCreatureColor(palette.throat), throat);
  });
  const pieces = [dome];
  const eyes = [-1, 1].map((side) => ({
    center: [side * 0.115, 0.036, 0.224],
    radii: [0.086, 0.1, 0.027],
  }));
  for (const [i, eye] of eyes.entries()) {
    pieces.push(
      transformCreatureGeometry(
        fillCreatureGeometryColor(
          createCreatureEllipsoidGeometry(...eye.radii, 20, 14),
          palette.face,
        ),
        eye.center,
      ),
    );
    const side = i ? 1 : -1;
    pieces.push(
      transformCreatureGeometry(
        fillCreatureGeometryColor(
          createCreatureEllipsoidGeometry(0.052, 0.034, 0.011, 14, 10),
          palette.cheek,
        ),
        [side * 0.185, -0.058, 0.195],
        [0, side * 0.4, side * 0.1],
      ),
    );
  }
  // Soft crown wisps and swept ear tufts use the same organic feather surface as wings.
  for (let i = -1; i <= 1; i++) {
    pieces.push(
      createBirdFeather(
        0.033,
        0.105 + (i === 0 ? 0.038 : 0),
        palette.back,
        palette.cover,
        [i * 0.041, 0.235, -0.015],
        [i * 0.45 - 0.32, 1, 0.24],
        i * 0.3,
      ),
    );
  }
  pieces.push(
    transformCreatureGeometry(
      fillCreatureGeometryColor(
        createCreatureEllipsoidGeometry(0.028, 0.026, 0.026, 12, 10),
        0x50342c,
      ),
      [0, -0.063, 0.249],
    ),
  );
  pieces.push(
    createBirdFeather(
      0.038,
      0.084,
      palette.beak,
      palette.beakTip,
      [0, -0.035, 0.248],
      [0, -0.32, 1],
      0,
    ),
  );
  pieces.push(
    createBirdFeather(
      0.024,
      0.053,
      palette.beakTip,
      palette.beak,
      [0, -0.077, 0.25],
      [0, 0.05, 1],
      Math.PI,
    ),
  );
  addCreatureBoneMesh(
    head,
    mergeCreatureGeometries(pieces),
    materials.fluff,
    null,
    null,
    "birdHead",
  );
  const face = buildCreatureFace(head, {
    surface,
    eye: {
      surfaces: eyes,
      style: "bulge",
      yaw: 0.06,
      pitch: -0.035,
      size: [0.061, 0.076, 0.017],
      iris: palette.iris,
      top: 0x382922,
      pupil: 0.61,
      sink: 0.1,
    },
    mouth: { style: "none" },
    happy: { eyes: "arc" },
  });
  return face;
}
