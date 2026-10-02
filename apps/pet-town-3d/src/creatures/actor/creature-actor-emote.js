export function creatureActorEmote(kind, duration = 1.6, force = false) {
  if (!(!force && (this.emoteCd > 0 || this.sleep > 0.5))) {
    this.emoter.show(kind, duration);
    this.emoteCd = duration + this.rng.range(1.5, 4);
    if (kind === `note` || kind === `music2` || kind === `heart`) {
      this.mouthOpenT = Math.max(this.mouthOpenT, 0.6);
    }
  }
}
