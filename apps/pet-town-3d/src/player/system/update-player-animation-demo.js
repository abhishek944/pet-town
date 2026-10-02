/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
export function updatePlayerAnimationDemo(animValue, value, value2) {
  let anim2 = animValue.anim;
  if (
    anim2 &&
    ((animValue.demoT += value),
    (anim2 === `stretch` || anim2 === `bounce`) &&
      (animValue.char.fidget ||
        (animValue.char.fidget = {
          type: anim2,
          t: 0,
        })),
    anim2 === `jump`)
  ) {
    let body2 = animValue.body;
    let result = animValue.demoT % 1;
    let result2 = (animValue.demoT - value) % 1;
    let result3 = 0.66;
    let result4 = 10 / (result3 * result3);
    let result5 = (result4 * result3) / 2;
    let result6 = result - 0.14;
    if (result2 < 0.14 && result >= 0.14) {
      body2.events.push({
        type: `jump`,
      });
    }
    if (result2 < 0.8 && result >= 0.8) {
      body2.events.push({
        type: `land`,
        impact: result5,
      });
    }
    let result7 = result6 >= 0 && result6 < result3;
    body2.pos.y =
      animValue.demoGround + (result7 ? result5 * result6 - 0.5 * result4 * result6 * result6 : 0);
    body2.prev.copy(body2.pos);
    body2.vel.y = result7 ? result5 - result4 * result6 : 0;
    body2.onGround = !result7;
  }
}
