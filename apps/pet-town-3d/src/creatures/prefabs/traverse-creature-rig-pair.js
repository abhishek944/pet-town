/** Cached baked species rigs and independent skeleton cloning. */
export function traverseCreatureRigPair(childrenValue, childrenValue2, value) {
  value(childrenValue, childrenValue2);
  for (let index = 0; index < childrenValue.children.length; index++) {
    traverseCreatureRigPair(childrenValue.children[index], childrenValue2.children[index], value);
  }
}
