/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
export let configureCreatureLegBone = (userDataValue, value, value2 = {}) => {
  userDataValue.userData.leg = {
    phase: value,
    amp: 0.6,
    ...value2,
  };
  return userDataValue;
};
