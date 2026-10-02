export function getPlayerWorldFloorY() {
  let minY2 = this.t?.minY;
  return typeof minY2 == `number` ? minY2 : 0;
}
