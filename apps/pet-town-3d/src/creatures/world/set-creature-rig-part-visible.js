/** Creature system namespace, world state, terrain queries, obstruction checks and nearby effects. */
export let setCreatureRigPartVisible = (scaleValue, value) => {
  if (value) {
    if (scaleValue.scale.x === 0) {
      scaleValue.scale.setScalar(1);
    }
  } else {
    scaleValue.scale.setScalar(0);
  }
};
