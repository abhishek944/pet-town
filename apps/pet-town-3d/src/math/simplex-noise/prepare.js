/** Seeded 2D and 3D simplex noise, fractal Brownian motion and ridged noise. */
import { mathState } from "../state.js";
export function prepareMathSimplexNoise() {
  mathState.simplexSkew2d = 0.5 * (Math.sqrt(3) - 1);
  mathState.simplexUnskew2d = (3 - Math.sqrt(3)) / 6;
  mathState.simplexSkew3d = 1 / 3;
  mathState.simplexUnskew3d = 1 / 6;
  mathState.simplexGradientVectors = new Float32Array([
    1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1,
    1, 0, 1, -1, 0, -1, -1,
  ]);
}
