/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */

export function prepareFaceSubdivisions(face, chunk, state) {
  face.axisU = face.frame.ua;
  face.axisV = face.frame.va;
  face.cornerBevelMasks = [0, 0, 0, 0];
  for (let index34 = 0; index34 < 4; index34++) {
    let result117 = index34 & 1;
    let result118 = index34 >> 1;
    face.cornerBevelMasks[index34] = state.cornerBevelAxes(
      face.frame.o[0] + face.frame.U[0] * result117 + face.frame.V[0] * result118,
      face.frame.o[1] + face.frame.U[1] * result117 + face.frame.V[1] * result118,
      face.frame.o[2] + face.frame.U[2] * result117 + face.frame.V[2] * result118,
    );
  }
  face.isBeveledU = (value56) => (face.cornerBevelMasks[value56] >> face.axisU) & 1;
  face.isBeveledV = (value57) => (face.cornerBevelMasks[value57] >> face.axisV) & 1;
  face.shoreSubdivideU = false;
  face.shoreSubdivideV = false;
  if (
    face.y === 7 &&
    face.direction !== 3 &&
    state.faceTouchesShore(face.x, face.z, face.direction)
  ) {
    if (face.axisU !== 1) {
      face.shoreSubdivideU = true;
    }
    if (face.axisV !== 1) {
      face.shoreSubdivideV = true;
    }
  }
  face.countU = 0;
  face.countV = 0;
  face.appendU = (value58, value59) => {
    chunk.subdivisionU[face.countU] = value58;
    chunk.subdivisionKindsU[face.countU++] = value59;
  };
  face.appendV = (value60, value61) => {
    chunk.subdivisionV[face.countV] = value60;
    chunk.subdivisionKindsV[face.countV++] = value61;
  };
  face.appendU(0, 0);
  if (face.isBeveledU(0) || face.isBeveledU(2)) {
    face.appendU(state.bevelInset, 1);
    face.appendU(state.bevel, 1);
  }
  if (face.shoreSubdivideU) {
    face.appendU(0.25, 4);
    face.appendU(0.5, 4);
    face.appendU(0.75, 4);
  }
  if (face.isBeveledU(1) || face.isBeveledU(3)) {
    face.appendU(1 - state.bevel, 2);
    face.appendU(1 - state.bevelInset, 2);
  }
  face.appendU(1, 3);
  face.appendV(0, 0);
  if (face.isBeveledV(0) || face.isBeveledV(1)) {
    face.appendV(state.bevelInset, 1);
    face.appendV(state.bevel, 1);
  }
  if (face.shoreSubdivideV) {
    face.appendV(0.25, 4);
    face.appendV(0.5, 4);
    face.appendV(0.75, 4);
  }
  if (face.isBeveledV(2) || face.isBeveledV(3)) {
    face.appendV(1 - state.bevel, 2);
    face.appendV(1 - state.bevelInset, 2);
  }
  face.appendV(1, 3);
}
