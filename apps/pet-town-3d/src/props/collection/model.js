import { PropGeometryBuilder } from "../geometry-builder/prop-geometry-builder.js";
import { PropRandom } from "../math/prop-random.js";
import { getPropMaterials } from "../materials/get-prop-materials.js";
import { getWorldAsset } from "./catalog.js";
import { appendWorldAsset } from "./append.js";

/** Preview and world use the same appenders and borrowed material library. */
export function createAssetModel(id) {
  const asset = getWorldAsset(id);
  if (!asset) throw new Error("This asset is unavailable.");
  const builder = new PropGeometryBuilder(asset.seed).begin();
  const metadata = appendWorldAsset(builder, new PropRandom(asset.seed), id);
  const model = builder.build(getPropMaterials());
  model.name = asset.name;
  model.userData.assetId = id;
  model.userData.metadata = metadata;
  return model;
}
