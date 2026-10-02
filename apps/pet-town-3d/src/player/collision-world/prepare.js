/** Terrain, voxel and prop collision queries, walkable platforms, water and camera occlusion. */
import { playerState } from "../state.js";
export function preparePlayerCollisionWorld() {
  playerState.playerGardenOccluderPattern = /garden|arch|trellis|pergola|washing|clothes/i;
  playerState.playerBuildingOccluderPattern =
    /cottage|cabin|house|home|windmill|stall|shop|market|barn|bakery|inn|tower|shed|hut/i;
  playerState.playerNonSolidBlockPattern =
    /^(air|empty|none|water|flower|tallgrass|grass_plant|plant|sapling|torch)$/i;
}
