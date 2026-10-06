import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function smooth(a, b, x) {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function bodyColor(fish, x, y, out) {
  out.copy(fish.baseColor);
  if (fish.id === "clementine" || fish.id === "sailfin") {
    const centers = fish.id === "clementine" ? [-0.52, 0.02, 0.54] : [-0.53, -0.02, 0.5];
    for (const center of centers) {
      const d = Math.abs(x - center);
      const band = 1 - smooth(0.105, 0.16, d);
      const edge = smooth(0.11, 0.145, d) * (1 - smooth(0.17, 0.21, d));
      out.lerp(fish.inkColor, edge * (fish.id === "clementine" ? 0.34 : 0.22));
      out.lerp(fish.creamColor, band);
    }
  } else {
    const d = Math.abs(y - 0.035);
    out.lerp(fish.inkColor, smooth(0.075, 0.105, d) * (1 - smooth(0.13, 0.17, d)) * 0.16);
    out.lerp(fish.creamColor, 1 - smooth(0.075, 0.13, d));
  }
  return out;
}

export function bodyGeometry(fish) {
  const geometry = new THREE.SphereGeometry(1, 72, 32);
  const positions = geometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i),
      z = positions.getZ(i);
    const taper = 1 - Math.abs(x) * 0.1;
    positions.setXYZ(i, x * fish.length, y * fish.height * taper, z * fish.width * taper);
    bodyColor(fish, x, y, color).toArray(colors, i * 3);
  }
  geometry.deleteAttribute("uv");
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function solid(geometry, color) {
  const tint = new THREE.Color(color),
    colors = new Float32Array(geometry.getAttribute("position").count * 3);
  for (let i = 0; i < colors.length; i += 3) tint.toArray(colors, i);
  geometry.deleteAttribute("uv");
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  return geometry;
}

export function fin(draw, color, z = 0) {
  const shape = new THREE.Shape();
  draw(shape);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.035,
    bevelEnabled: false,
    curveSegments: 12,
  });
  geometry.translate(0, 0, z - 0.0175);
  return solid(geometry, color);
}

export function tube(points, color, radius = 0.006) {
  const path = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  return solid(new THREE.TubeGeometry(path, 10, radius, 4, false), color);
}

export function sphere(position, scale, color) {
  const geometry = new THREE.SphereGeometry(1, 12, 8);
  geometry.scale(...scale);
  geometry.translate(...position);
  return solid(geometry, color);
}

export function merge(parts) {
  const normalized = parts.map((part) => (part.index ? part.toNonIndexed() : part));
  const geometry = mergeGeometries(normalized, false);
  for (let i = 0; i < parts.length; i++) {
    if (normalized[i] !== parts[i]) normalized[i].dispose();
    parts[i].dispose();
  }
  return geometry;
}
