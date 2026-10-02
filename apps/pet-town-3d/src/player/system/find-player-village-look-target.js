/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
export function findPlayerVillageLookTarget(propsValue, position) {
  let plaza2 = propsValue.props?.plaza;
  if (
    plaza2 &&
    isFinite(plaza2.x) &&
    Math.hypot(plaza2.x - position.x, plaza2.z - position.z) > 3
  ) {
    return plaza2;
  }
  let list2 = propsValue.props?.list;
  if (!Array.isArray(list2)) {
    return null;
  }
  let index = 0;
  let index2 = 0;
  let index3 = 0;
  for (let position2 of list2) {
    if (!(
      !(position2?.radius >= 1.5) ||
      Math.hypot(position2.x - position.x, position2.z - position.z) > 35
    )) {
      index += position2.x;
      index2 += position2.z;
      index3++;
    }
  }
  return index3 && Math.hypot(index / index3 - position.x, index2 / index3 - position.z) > 3
    ? {
        x: index / index3,
        z: index2 / index3,
      }
    : null;
}
