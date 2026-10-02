export function playerWorldRefresh(deltaTime) {
  let t2 = this.t;
  if (t2 !== this._t) {
    this._t = t2;
    this._probeT = 0;
    this._scanIds();
  }
  this._probeT -= deltaTime;
  if (this._probeT <= 0) {
    this._probeT = 2;
    this._probe();
  }
}
