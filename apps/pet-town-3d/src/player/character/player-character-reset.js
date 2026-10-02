export function playerCharacterReset() {
  this.w = {
    ground: 1,
    air: 0,
    glide: 0,
    swim: 0,
    move: 0,
  };
  this.runAmt = 0;
  this.lean = 0;
  this.bank = 0;
  this.turnRate = 0;
  this.headVy = 0;
  this.mouth = 0;
  this.happy = 0;
  for (let result of [
    this.sq,
    this.leafS,
    ...this.earS,
    this.earSide,
    this.tailS,
    this.tail2S,
    this.scarfS,
    this.scarfS2,
    this.neckS,
  ]) {
    result.x = 0;
    result.v = 0;
  }
  this.tailP.x = 0.35;
  this.tailP.v = 0;
  this.accS = 0;
  this.knit = 0;
  this.raise = 0;
  this.worry = 0;
}
