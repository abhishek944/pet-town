/** Bump encoding, texture array generation and incremental custom texture registration. */
import * as THREE from "three";
import { terrainState } from "../../state.js";
export function createTerrainArrayTexture(value, value2, capabilitiesValue) {
  let dataArrayTexture = new THREE.DataArrayTexture(
    value,
    terrainState.terrainTexturePixelSize,
    terrainState.terrainTexturePixelSize,
    value2,
  );
  dataArrayTexture.format = THREE.RGBAFormat;
  dataArrayTexture.type = THREE.UnsignedByteType;
  dataArrayTexture.colorSpace = THREE.SRGBColorSpace;
  dataArrayTexture.wrapS = dataArrayTexture.wrapT = THREE.RepeatWrapping;
  dataArrayTexture.magFilter = THREE.LinearFilter;
  dataArrayTexture.minFilter = THREE.LinearMipmapLinearFilter;
  dataArrayTexture.generateMipmaps = true;
  dataArrayTexture.anisotropy = capabilitiesValue?.capabilities?.getMaxAnisotropy?.() ?? 8;
  dataArrayTexture.needsUpdate = true;
  return dataArrayTexture;
}
