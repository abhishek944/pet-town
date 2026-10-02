/** Typed buffer growth, beveled chunk construction, grass lip geometry and voxel hashing. */
export function growTypedArrayCapacity(values, value) {
  if (value <= values.length) {
    return values;
  }
  let value2 = new values.constructor(Math.max(value, Math.ceil(values.length * 1.6)));
  value2.set(values);
  return value2;
}
