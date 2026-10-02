export function playerInputAnyPressed(codes) {
  for (let result of codes) {
    if (this.pressed.has(result)) {
      return true;
    }
  }
  return false;
}
