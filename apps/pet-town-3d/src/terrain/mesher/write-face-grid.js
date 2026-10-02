/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */

export function writeFaceGrid(face, chunk, state) {
  for (let index36 = 0; index36 < face.countV; index36++) {
    for (let index37 = 0; index37 < face.countU; index37++) {
      let result122 = index36 * face.countU + index37;
      let result123 = chunk.subdivisionKindsU[index37];
      let result124 = chunk.subdivisionKindsV[index36];
      let result125 = result123 === 0 || result123 === 3;
      let result126 = result124 === 0 || result124 === 3;
      let result127 = -1;
      if (result125 && result126) {
        result127 = -1;
      } else if (result126) {
        let result130 = result124 === 0 ? 0 : 2;
        let result131 = result124 === 0 ? 1 : 3;
        if (result123 === 1 && !face.isBeveledU(result130)) {
          result127 = result130;
        } else {
          if (result123 === 2 && !face.isBeveledU(result131)) {
            result127 = result131;
          } else {
            if (result123 === 4 && !(result124 === 0 ? face.shoreLowV : face.shoreHighV)) {
              result127 = 100 + (result122 - 1);
            }
          }
        }
      } else if (result125) {
        let result132 = result123 === 0 ? 0 : 1;
        let result133 = result123 === 0 ? 2 : 3;
        if (result124 === 1 && !face.isBeveledV(result132)) {
          result127 = result132;
        } else {
          if (result124 === 2 && !face.isBeveledV(result133)) {
            result127 = result133;
          } else {
            if (result124 === 4 && !(result123 === 0 ? face.shoreLowU : face.shoreHighU)) {
              result127 = 100 + (result122 - face.countU);
            }
          }
        }
      }
      if (result127 >= 0) {
        chunk.gridVertices[result122] = -1 - result127;
        continue;
      }
      let result128 = chunk.subdivisionU[index37];
      let result129 = chunk.subdivisionV[index36];
      chunk.gridVertices[result122] = chunk.emitVertex(result128, result129);
      chunk.gridAo[result122] = chunk.faceData[chunk.gridVertices[result122] * 4 + 2];
      if (result125 && result126) {
        face.cornerVertices[+(result123 === 3) + (result124 === 3 ? 2 : 0)] =
          chunk.gridVertices[result122];
      }
    }
  }
  for (let index38 = 0; index38 < face.countU * face.countV; index38++) {
    let result134 = chunk.gridVertices[index38];
    if (result134 >= 0) {
      continue;
    }
    let result135 = -1 - result134;
    chunk.gridVertices[index38] =
      result135 >= 100 ? chunk.gridVertices[result135 - 100] : face.cornerVertices[result135];
    chunk.gridAo[index38] = chunk.faceData[chunk.gridVertices[index38] * 4 + 2];
  }
  for (let index39 = 0; index39 < face.countV - 1; index39++) {
    for (let index40 = 0; index40 < face.countU - 1; index40++) {
      let result136 = index39 * face.countU + index40;
      let result137 = chunk.gridVertices[result136];
      let result138 = chunk.gridVertices[result136 + 1];
      let result139 = chunk.gridVertices[result136 + face.countU + 1];
      let result140 = chunk.gridVertices[result136 + face.countU];
      let result141 = chunk.gridAo[result136];
      let result142 = chunk.gridAo[result136 + 1];
      let result143 = chunk.gridAo[result136 + face.countU + 1];
      let result144 = chunk.gridAo[result136 + face.countU];
      let callback15 = (value64, value65, value66) => {
        if (value64 !== value65 && value65 !== value66 && value64 !== value66) {
          chunk.indices[chunk.indexCount++] = value64;
          chunk.indices[chunk.indexCount++] = value65;
          chunk.indices[chunk.indexCount++] = value66;
        }
      };
      if (result141 + result143 > result142 + result144) {
        callback15(result137, result138, result140);
        callback15(result138, result139, result140);
      } else {
        callback15(result137, result138, result139);
        callback15(result137, result139, result140);
      }
    }
  }
  chunk.faceCount++;
}
