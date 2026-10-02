export function playerCameraHoldIntro() {
  if (this.frozen || this.introStarted) {
    return;
  }
  this._prepIntro();
  let _establishingResult = this._establishing();
  this.intro = this._planIntro({
    t: 0,
    dur: 2.5,
    yaw0: _establishingResult.yaw,
    pitch0: _establishingResult.pitch,
    dist0: _establishingResult.dist,
    hold: true,
  });
}
