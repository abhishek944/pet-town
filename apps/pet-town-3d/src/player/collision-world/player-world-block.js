export function playerWorldBlock(x, y, z) {
  try {
    return this.t.blockAt(x, y, z);
  } catch {
    return 0;
  }
}
