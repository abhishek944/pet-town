export function playerCameraPrepIntro() {
  let focus2 = this.focus;
  this.world.gatherColliders(focus2.x, focus2.y, focus2.z, 30);
}
