export function animatePlayerGlider(pose, deltaTime, time) {
  let result15 = +(pose.leaf > 0.5);
  let result16 = Math.max(0, this.leafS.update(result15, deltaTime));
  this.leafRig.visible = result16 > 0.02;
  this.leafRig.scale.setScalar(Math.max(0.001, result16));
  this.canopy.rotation.x = Math.sin(time * 3.1) * 0.06 - 0.08;
  this.canopy.rotation.y = Math.sin(time * 1.7) * 0.15;
  this.canopy.rotation.z = -0.3 - this.bank * 0.6;
}
