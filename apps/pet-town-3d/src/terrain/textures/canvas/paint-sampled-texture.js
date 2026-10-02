/** Logical canvas scale, palette conversions, wrapped painting primitives and seamless noise sampling. */
import { createSampledTextureCanvas } from "./create-sampled-texture-canvas.js";
import { terrainState } from "../../state.js";
export function paintSampledTexture(painter, value) {
  painter.save();
  painter.imageSmoothingEnabled = true;
  painter.imageSmoothingQuality = `high`;
  painter.drawImage(
    createSampledTextureCanvas(value),
    0,
    0,
    terrainState.terrainTextureLogicalSize,
    terrainState.terrainTextureLogicalSize,
  );
  painter.restore();
}
