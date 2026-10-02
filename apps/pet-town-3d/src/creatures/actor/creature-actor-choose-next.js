export function creatureActorChooseNext(frame) {
  let traits2 = this.traits;
  let rng2 = this.rng;
  if (this.flying && !this.flyer) {
    this.state = `land`;
    this.t = 0;
    this.goal = null;
    return;
  }
  if (this.inWater && !this.swimmer) {
    this.setState(`escape`, 8);
    return;
  }
  if (this.flyer) {
    if (
      (!this.flying &&
        rng2() < 0.75 &&
        ((this.flying = true), (this.alt = rng2.range(...this.def.flyAlt))),
      !this.flying)
    ) {
      this.setState(rng2() < 0.5 ? `rest` : `idle`, rng2.range(3, 7));
      return;
    }
    if (this.flying) {
      let rng2Result = rng2();
      if (rng2Result < 0.55) {
        this.setState(`fly`, rng2.range(4, 8));
        return;
      }
      if (rng2Result < 0.7 && this.tryPlay(frame)) {
        return;
      }
      if (rng2Result < 0.85) {
        this.setState(`look`, rng2.range(2, 3.5));
        return;
      }
      this.state = `land`;
      this.t = 0;
      this.goal = null;
      return;
    }
  }
  let values = [
    [`wander`, 3 + 3 * traits2.energy],
    [`idle`, 2],
    [`look`, 1.2],
    [`graze`, (traits2.grazer ?? 0) * 3 + (traits2.sniffer ?? 0) * 2 + (traits2.pecker ?? 0) * 3],
    [`play`, traits2.playful * 2.2],
    [`swim`, this.swimmer ? 3 : 0],
    [`fly`, traits2.canFly ? 1.2 : 0],
    [`rest`, (traits2.lazy ?? 0.3) * +!this.inWater],
  ];
  let index = 0;
  for (let result2 of values) {
    index += result2[1];
  }
  let result = rng2() * index;
  let text = `idle`;
  for (let [result3, result4] of values) {
    if ((result -= result4) <= 0) {
      text = result3;
      break;
    }
  }
  if ((text === `play` && !this.tryPlay(frame) && (text = `wander`), text !== `play`)) {
    if (text === `swim`) {
      let pickTargetResult = this.pickTarget(9, this.position, {
        water: true,
      });
      if (!pickTargetResult) {
        text = `wander`;
      } else {
        this.waterSpot = pickTargetResult;
        this.setState(`swim`, rng2.range(6, 12));
        this.goal = pickTargetResult;
        this.goalSpeed = this.def.walk;
        return;
      }
    }
    if (text === `fly`) {
      let pickTargetResult2 = this.pickTarget(12, this.home, {
        min: 4,
      });
      if (pickTargetResult2) {
        this.flying = true;
        this.alt = rng2.range(...this.def.flyAlt);
        this.setState(`fly`, 6);
        this.goal = pickTargetResult2;
        this.goalSpeed = this.def.run * 1.1;
        this.emote(`note`, 1.2);
        return;
      }
      text = `wander`;
    }
    this.setState(
      text,
      text === `graze`
        ? rng2.range(3, 6)
        : text === `look`
          ? rng2.range(2, 4)
          : text === `rest`
            ? rng2.range(6, 12)
            : rng2.range(2, 5),
    );
  }
}
