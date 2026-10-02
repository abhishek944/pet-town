export function playerCharacterOnJump() {
  this.sq.x = -0.16;
  this.sq.v = 8;
  this.happy = 1;
  this.raise = 1;
  this.mouth = Math.max(this.mouth, 0.8);
}
