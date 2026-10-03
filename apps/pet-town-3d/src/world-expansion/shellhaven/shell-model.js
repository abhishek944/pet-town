import * as THREE from "three";

/** Three small sculpted forms share their palette between shore and display. */
export function createShellModel(model, shell) {
  const group = new THREE.Group();
  group.position.y = shell.shape === "spiral" ? 0.24 : 0.1;
  const mesh = (geometry, color) => model.mesh(geometry, color, group);
  if (shell.shape === "fan") {
    const body = mesh(new THREE.SphereGeometry(0.32, 16, 10), shell.color);
    body.scale.set(1, 0.3, 1.12);
    for (let rib = -3; rib <= 3; rib++) {
      const angle = rib * 0.23;
      const item = mesh(new THREE.CylinderGeometry(0.018, 0.035, 0.55, 6), 0xffedcd);
      item.rotation.x = Math.PI / 2;
      item.rotation.z = angle;
      item.position.set(Math.sin(angle) * 0.1, 0.075, -0.01);
    }
    const hinge = mesh(new THREE.SphereGeometry(0.1, 8, 6), shell.color);
    hinge.position.z = -0.28;
  } else if (shell.shape === "spiral") {
    const body = mesh(new THREE.ConeGeometry(0.24, 0.62, 12), shell.color);
    body.rotation.x = Math.PI / 2;
    body.position.z = -0.04;
    for (let ring = 0; ring < 4; ring++) {
      const item = mesh(new THREE.TorusGeometry(0.09 + ring * 0.045, 0.025, 6, 16), 0xffebd0);
      item.position.z = 0.23 - ring * 0.13;
    }
    const opening = mesh(new THREE.SphereGeometry(0.14, 10, 8), 0xf3d5ac);
    opening.scale.set(0.8, 0.35, 1);
    opening.position.z = 0.27;
  } else {
    const body = mesh(new THREE.SphereGeometry(0.3, 14, 10), shell.color);
    body.scale.set(1, 0.3, 0.85);
    const lip = mesh(new THREE.TorusGeometry(0.23, 0.035, 6, 18), 0xfff4d5);
    lip.rotation.x = Math.PI / 2;
    lip.scale.z = 0.8;
    lip.position.y = 0.065;
    const pearl = mesh(new THREE.SphereGeometry(0.095, 12, 8), 0xfffaf0);
    pearl.position.y = 0.12;
  }
  return group;
}
