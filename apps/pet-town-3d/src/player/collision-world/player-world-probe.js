export function playerWorldProbe() {
  let t2 = this.t;
  if (((this.live = false), t2 && typeof t2.blockAt == `function`)) {
    for (let [result, result2] of [
      [0, 0],
      [3, -2],
      [-5, 4],
      [7, 7],
      [-9, -6],
      [12, -3],
    ]) {
      let _rawTopResult = this._rawTop(result + 0.5, result2 + 0.5);
      if (_rawTopResult == null) {
        continue;
      }
      let result3 = Math.floor(_rawTopResult) - 1;
      for (let result4 = 1; result4 >= -2; result4--) {
        if (this.solidValue(this.block(result, result3 + result4, result2))) {
          this.live = true;
          return;
        }
      }
    }
  }
}
