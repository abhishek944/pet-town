import { bodyGeometry, fin, merge, sphere, tube } from "./fish-geometry-parts.js";

export function bodyDetails(fish) {
  const { length: l, height: h, width: w } = fish;
  const parts = [bodyGeometry(fish)];
  const dorsal = (shape) => {
    if (fish.id === "sailfin") {
      shape.moveTo(-l * 0.76, h * 0.38);
      shape.quadraticCurveTo(-l * 0.73, h * 1.45, -l * 0.28, h * 1.78);
      shape.quadraticCurveTo(l * 0.16, h * 1.58, l * 0.61, h * 0.42);
      shape.quadraticCurveTo(l * 0.34, h * 0.72, 0, h * 0.61);
      shape.quadraticCurveTo(-l * 0.42, h * 0.55, -l * 0.76, h * 0.38);
    } else {
      const crest = fish.id === "clementine" ? 1.62 : 1.38;
      shape.moveTo(-l * 0.72, h * 0.48);
      shape.quadraticCurveTo(-l * 0.57, h * crest, -l * 0.16, h * (crest + 0.06));
      shape.quadraticCurveTo(l * 0.22, h * (crest - 0.06), l * 0.5, h * 0.46);
      shape.quadraticCurveTo(l * 0.24, h * 0.67, -l * 0.08, h * 0.63);
      shape.quadraticCurveTo(-l * 0.42, h * 0.59, -l * 0.72, h * 0.48);
    }
  };
  const anal = (shape) => {
    shape.moveTo(-l * 0.48, -h * 0.42);
    shape.quadraticCurveTo(
      -l * 0.24,
      -h * 1.1,
      l * 0.12,
      -h * (fish.id === "sailfin" ? 1.38 : fish.id === "clementine" ? 1.35 : 1.15),
    );
    shape.quadraticCurveTo(l * 0.4, -h * 0.8, l * 0.48, -h * 0.34);
    shape.quadraticCurveTo(l * 0.05, -h * 0.55, -l * 0.48, -h * 0.42);
  };
  parts.push(fin(dorsal, fish.fin), fin(anal, fish.fin));
  for (const side of [-1, 1]) {
    const z = side * w * 0.92;
    for (let ray = 0; ray < 4; ray++) {
      const x = -l * 0.56 + ray * l * 0.16;
      parts.push(
        tube(
          [
            [x, h * 0.58, side * 0.021],
            [x + l * 0.04, h * 0.87, side * 0.021],
            [x + l * 0.13, h * 1.02, side * 0.021],
          ],
          fish.ray,
          0.004,
        ),
      );
    }
    const eyeX = l * 0.61,
      eyeY = h * 0.1,
      eyeZ = side * w * 0.79;
    parts.push(
      sphere([eyeX, eyeY, eyeZ], [fish.eye * 0.82, fish.eye, fish.eye * 0.45], fish.cream),
    );
    parts.push(
      sphere(
        [eyeX + l * 0.025, eyeY, side * (w * 0.93 + fish.eye * 0.2)],
        [fish.eye * 0.48, fish.eye * 0.64, fish.eye * 0.26],
        0x203f48,
      ),
    );
    parts.push(
      sphere(
        [eyeX + l * 0.04, eyeY + fish.eye * 0.25, side * (w + fish.eye * 0.36)],
        [fish.eye * 0.14, fish.eye * 0.15, fish.eye * 0.1],
        0xfffbea,
      ),
    );
    parts.push(
      tube(
        [
          [l * 0.12, -h * 0.2, z * 0.96],
          [l * 0.22, 0, z * 1.04],
          [l * 0.12, h * 0.24, z * 0.96],
        ],
        fish.ink,
        0.006,
      ),
    );
    parts.push(
      tube(
        [
          [l * 0.86, -h * 0.08, side * w * 0.45],
          [l * 0.94, -h * 0.04, side * w * 0.34],
          [l * 0.985, 0, side * w * 0.12],
        ],
        fish.ink,
        0.006,
      ),
    );
  }
  return merge(parts);
}

export function pectoralGeometry(fish) {
  const { length: l, height: h, width: w } = fish;
  const parts = [];
  for (const side of [-1, 1]) {
    const shape = (path) => {
      path.moveTo(l * 0.18, -h * 0.03);
      path.quadraticCurveTo(l * 0.02, -h * 0.02, -l * 0.28, -h * 0.46);
      path.quadraticCurveTo(-l * 0.45, -h * 0.58, -l * 0.5, -h * 0.36);
      path.quadraticCurveTo(-l * 0.25, -h * 0.08, l * 0.18, -h * 0.03);
    };
    parts.push(fin(shape, fish.fin, side * w * 0.82));
    parts.push(
      tube(
        [
          [l * 0.12, -h * 0.1, side * (w * 0.82 + 0.021)],
          [-l * 0.15, -h * 0.31, side * (w * 0.82 + 0.021)],
          [-l * 0.4, -h * 0.48, side * (w * 0.82 + 0.021)],
        ],
        fish.ray,
        0.004,
      ),
    );
  }
  return merge(parts);
}

export function tailGeometry(fish) {
  const { tailHeight: height, tailLength: length } = fish;
  const shape = (path) => {
    path.moveTo(0, 0);
    path.quadraticCurveTo(-length * 0.16, height * 0.14, -length * 0.54, height);
    path.quadraticCurveTo(-length * 0.92, height * 1.12, -length, height * 0.83);
    path.quadraticCurveTo(-length * 0.82, height * 0.28, -length * 0.58, 0);
    path.quadraticCurveTo(-length * 0.82, -height * 0.28, -length, -height * 0.83);
    path.quadraticCurveTo(-length * 0.92, -height * 1.12, -length * 0.54, -height);
    path.quadraticCurveTo(-length * 0.16, -height * 0.14, 0, 0);
  };
  const parts = [fin(shape, fish.fin)];
  for (const side of [-1, 1])
    for (const ray of [-1, 1])
      parts.push(
        tube(
          [
            [0, 0, side * 0.021],
            [-length * 0.33, ray * height * 0.12, side * 0.021],
            [-length * 0.91, ray * height * 0.83, side * 0.021],
          ],
          fish.ray,
          0.004,
        ),
      );
  return merge(parts);
}
