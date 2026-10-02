/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */

export function createVertexBevelResolver(state) {
  return function (value32, value33, value34) {
    state.localPosition[0] = value32;
    state.localPosition[1] = value33;
    state.localPosition[2] = value34;
    let index8 = 0;
    let index9 = 0;
    let index10 = 0;
    for (let index16 = 0; index16 < 3; index16++) {
      let result42 = state.localPosition[index16];
      state.interiorEdgeDirections[index16] = 0;
      if (result42 === 0) {
        state.boundaryAxes[index8] = index16;
        state.boundaryOffsets[index8] = -1;
        index9 |= 1 << index8;
        index8++;
      } else {
        if (result42 === 1) {
          state.boundaryAxes[index8] = index16;
          state.boundaryOffsets[index8] = 0;
          index8++;
        } else {
          if (result42 < state.bevel) {
            state.interiorEdgeDirections[index16] = -1;
            state.interiorEdgeDistances[index16] = state.bevel - result42;
            index10++;
          } else {
            if (result42 > 1 - state.bevel) {
              state.interiorEdgeDirections[index16] = 1;
              state.interiorEdgeDistances[index16] = result42 - (1 - state.bevel);
              index10++;
            }
          }
        }
      }
    }
    if (
      ((state.bevelResult[6] = 0),
      index8 + index10 < 2 || state.currentVoxelY + value33 <= state.flatBelow)
    ) {
      return;
    }
    let result38 = 1 << index8;
    for (let index17 = 0; index17 < result38; index17++) {
      state.neighborOffset[0] = state.neighborOffset[1] = state.neighborOffset[2] = 0;
      for (let index18 = 0; index18 < index8; index18++) {
        state.neighborOffset[state.boundaryAxes[index18]] =
          state.boundaryOffsets[index18] + ((index17 >> index18) & 1);
      }
      state.bevelOccupancy[index17] = state.cachedSolid(
        state.neighborOffset[0],
        state.neighborOffset[1],
        state.neighborOffset[2],
      );
      state.bevelVisited[index17] = 0;
    }
    let index11 = 0;
    let index12 = 0;
    for (state.bevelQueue[index12++] = index9, state.bevelVisited[index9] = 1; index11 < index12;) {
      let result43 = state.bevelQueue[index11++];
      for (let index19 = 0; index19 < index8; index19++) {
        let result44 = result43 ^ (1 << index19);
        if (state.bevelOccupancy[result44] && !state.bevelVisited[result44]) {
          state.bevelVisited[result44] = 1;
          state.bevelQueue[index12++] = result44;
        }
      }
    }
    let result39 = 1e9;
    let index13 = 0;
    let index14 = 0;
    let index15 = 0;
    let result40 = 1;
    for (let index20 = 0; index20 < result38 && result39 > 1e-7; index20++) {
      if (!state.bevelVisited[index20]) {
        continue;
      }
      state.candidateNormal[0] = state.candidateNormal[1] = state.candidateNormal[2] = 0;
      state.neighborOffset[0] = state.neighborOffset[1] = state.neighborOffset[2] = 0;
      for (let index21 = 0; index21 < index8; index21++) {
        state.neighborOffset[state.boundaryAxes[index21]] =
          state.boundaryOffsets[index21] + ((index20 >> index21) & 1);
      }
      let enabled = false;
      for (let index22 = 0; index22 < index8; index22++) {
        if (!state.bevelOccupancy[index20 ^ (1 << index22)]) {
          state.candidateNormal[state.boundaryAxes[index22]] =
            (index20 >> index22) & 1 ? -state.bevel : state.bevel;
          enabled = true;
        }
      }
      if (!enabled) {
        result39 = 0;
        break;
      }
      for (let index23 = 0; index23 < 3; index23++) {
        if (!state.interiorEdgeDirections[index23]) {
          continue;
        }
        let result46 =
          state.neighborOffset[0] + (index23 === 0 ? state.interiorEdgeDirections[index23] : 0);
        let result47 =
          state.neighborOffset[1] + (index23 === 1 ? state.interiorEdgeDirections[index23] : 0);
        let result48 =
          state.neighborOffset[2] + (index23 === 2 ? state.interiorEdgeDirections[index23] : 0);
        if (!state.cachedSolid(result46, result47, result48)) {
          state.candidateNormal[index23] =
            state.interiorEdgeDirections[index23] * state.interiorEdgeDistances[index23];
        }
      }
      let hypotResult = Math.hypot(
        state.candidateNormal[0],
        state.candidateNormal[1],
        state.candidateNormal[2],
      );
      let result45 = hypotResult - state.bevel;
      if (result45 < result39) {
        result39 = result45;
        index13 = state.candidateNormal[0];
        index14 = state.candidateNormal[1];
        index15 = state.candidateNormal[2];
        result40 = hypotResult;
      }
    }
    if (result39 <= 1e-6) {
      return;
    }
    let result41 = state.bevel / result40 - 1;
    state.bevelResult[0] = index13 * result41;
    state.bevelResult[1] = index14 * result41;
    state.bevelResult[2] = index15 * result41;
    state.bevelResult[3] = index13 / result40;
    state.bevelResult[4] = index14 / result40;
    state.bevelResult[5] = index15 / result40;
    state.bevelResult[6] = result39;
  };
}
