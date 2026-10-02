export function animatePlayerFidget(deltaTime, moveWeight, frame, pose) {
  let stretchAmount = 0;
  if (
    (!this.fidget &&
      this.idleT > 6.5 &&
      Math.random() < deltaTime * 0.3 &&
      (this.fidget = {
        type: Math.random() < 0.5 ? `stretch` : `bounce`,
        t: 0,
      }),
    this.fidget)
  ) {
    let fidget2 = this.fidget;
    fidget2.t += deltaTime;
    let callback2 = (value4, value5) =>
      Math.min(1, value4 / 0.3, Math.max(0, (value5 - value4) / 0.4));
    if (moveWeight > 0.2 || !frame.onGround || frame.swimming) {
      this.fidget = null;
    } else if (fidget2.type === `stretch`) {
      let callback2Result = callback2(fidget2.t, 1.9);
      stretchAmount = callback2Result;
      pose.alz += 2.1 * callback2Result;
      pose.arz -= 2.1 * callback2Result;
      pose.alx -= 0.35 * callback2Result;
      pose.arx -= 0.35 * callback2Result;
      pose.nx -= 0.3 * callback2Result;
      pose.hx -= 0.1 * callback2Result;
      pose.mouth += 0.9 * callback2Result;
      pose.hy += 0.03 * callback2Result;
      pose.el *= 1 - callback2Result;
      pose.er *= 1 - callback2Result;
      if (fidget2.t > 1.9) {
        this.fidget = null;
        this.idleT = 2;
      }
    } else {
      let result47 = fidget2.t / 0.34;
      let result48 = Math.floor(result47);
      let result49 = result47 - result48;
      if (result48 < 3) {
        if (result49 < deltaTime / 0.34 + 1e-6) {
          this.sq.v += 2.6;
          this.happy = 1;
        }
        pose.rootY += Math.sin(Math.PI * result49) * 0.09;
        pose.alz += 0.5;
        pose.arz -= 0.5;
        pose.mouth += 0.7;
        pose.kl += 0.25 * Math.sin(Math.PI * result49);
        pose.kr += 0.25 * Math.sin(Math.PI * result49);
        this.happyEyes = 1;
      } else {
        this.fidget = null;
        this.idleT = 2;
      }
    }
  }
  return {
    stretchAmount,
  };
}
