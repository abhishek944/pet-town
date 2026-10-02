/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
export let configureCreatureJiggleBone = (userDataValue, value) => {
  userDataValue.userData.jiggle = {
    dir: [0, 1, 0],
    len: 0.1,
    k: 120,
    d: 9,
    grav: 0,
    limit: 0.8,
    ...value,
  };
  return userDataValue;
};
