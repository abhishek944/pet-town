export function playerInputAny(codes) {
  for (let result of codes) {
    if (this.held.has(result)) {
      return true;
    }
  }
  return false;
}
