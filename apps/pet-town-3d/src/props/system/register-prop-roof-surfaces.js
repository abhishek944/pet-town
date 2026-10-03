import { propsState } from "../state.js";
import { getWorldAsset } from "../collection/catalog.js";

/** Index authored upward roof triangles once; physics samples only one spatial cell. */
export function registerPropRoofSurfaces(build) {
  const surfaces = new Map();
  const structural = new Set([
    "wood",
    "paint",
    "stone",
    "plaster",
    "plain",
    "rock",
    "thatch",
    "collectionGlass",
  ]);
  for (const [material, geometries] of build.builder.buckets) {
    if (material !== "shingle" && !structural.has(material)) continue;
    const tags = build.builder.tags.get(material) ?? [];
    for (let index = 0; index < geometries.length; index++) {
      const record = propsState.propsRuntime.recs.get(tags[index]);
      if (!record?.entry) continue;
      if (material !== "shingle" && getWorldAsset(record.entry.assetId)?.category !== "Buildings")
        continue;
      let surface = surfaces.get(record);
      if (!surface) {
        surface = {
          cells: new Map(),
          minX: Infinity,
          maxX: -Infinity,
          minZ: Infinity,
          maxZ: -Infinity,
        };
        surfaces.set(record, surface);
      }
      const p = geometries[index].attributes.position;
      for (let vertex = 0; vertex < p.count; vertex += 3) addTriangle(surface, p, vertex);
    }
  }
  for (const [record, surface] of surfaces) {
    const initialY = record.y;
    const heightAt = (x, z, maxHeight = Infinity, underside = false) => {
      if (x < surface.minX || x > surface.maxX || z < surface.minZ || z > surface.maxZ)
        return -Infinity;
      let top = underside ? Infinity : -Infinity;
      for (const t of surface.cells.get(`${Math.floor(x)},${Math.floor(z)}`) ?? []) {
        if (t[9] > 0 !== underside) continue;
        const dx = x - t[0],
          dz = z - t[1];
        const u = (dx * t[7] - dz * t[6]) / t[9];
        const v = (t[3] * dz - t[4] * dx) / t[9];
        if (u >= -t[10] && v >= -t[11] && u + v <= 1 + t[12]) {
          const y = t[2] + u * t[5] + v * t[8];
          if (y + record.y - initialY <= maxHeight) {
            top = underside ? Math.min(top, y) : Math.max(top, y);
          }
        }
      }
      return top + record.y - initialY;
    };
    record.entry.roofHeight = heightAt;
    for (const collider of record.cols) {
      collider.roofHeight = heightAt;
      if (collider.noTop && collider.w > 1 && collider.d > 1 && collider.y0 > record.y + 1.5) {
        collider.ceilingHeight = (x, z) => heightAt(x, z, Infinity, true);
      }
    }
  }
}

function addTriangle(surface, p, vertex) {
  const ax = p.getX(vertex),
    ay = p.getY(vertex),
    az = p.getZ(vertex);
  const bx = p.getX(vertex + 1),
    by = p.getY(vertex + 1),
    bz = p.getZ(vertex + 1);
  const cx = p.getX(vertex + 2),
    cy = p.getY(vertex + 2),
    cz = p.getZ(vertex + 2);
  const ux = bx - ax,
    uy = by - ay,
    uz = bz - az;
  const vx = cx - ax,
    vy = cy - ay,
    vz = cz - az;
  const det = ux * vz - uz * vx;
  const normalLength = Math.hypot(uy * vz - uz * vy, det, ux * vy - uy * vx);
  if (Math.abs(det) < normalLength * 0.35 || Math.abs(det) < 1e-7) return;
  // Millimetre-wide decorative plank gaps must not swallow a character's feet.
  const contact = 0.015,
    scale = contact / Math.abs(det);
  const triangle = [
    ax,
    az,
    ay,
    ux,
    uz,
    uy,
    vx,
    vz,
    vy,
    det,
    Math.hypot(vx, vz) * scale,
    Math.hypot(ux, uz) * scale,
    Math.hypot(vx - ux, vz - uz) * scale,
  ];
  const minX = Math.min(ax, bx, cx) - contact,
    maxX = Math.max(ax, bx, cx) + contact;
  const minZ = Math.min(az, bz, cz) - contact,
    maxZ = Math.max(az, bz, cz) + contact;
  surface.minX = Math.min(surface.minX, minX);
  surface.maxX = Math.max(surface.maxX, maxX);
  surface.minZ = Math.min(surface.minZ, minZ);
  surface.maxZ = Math.max(surface.maxZ, maxZ);
  for (let x = Math.floor(minX); x <= Math.floor(maxX); x++) {
    for (let z = Math.floor(minZ); z <= Math.floor(maxZ); z++) {
      const key = `${x},${z}`;
      let cell = surface.cells.get(key);
      if (!cell) surface.cells.set(key, (cell = []));
      cell.push(triangle);
    }
  }
}
