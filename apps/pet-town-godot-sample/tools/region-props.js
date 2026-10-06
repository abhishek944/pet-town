import * as THREE from "../../pet-town-3d/node_modules/three/build/three.module.js";
import { propsState } from "../../pet-town-3d/src/props/state.js";
import { exportMaterial, rangeGeometry } from "./export-materials.js";
import { glb, inside, png, uniforms } from "./region-data.js";
import { geometryData } from "./region-vegetation.js";

const simple = (object) =>
  JSON.parse(
    JSON.stringify(object, (key, value) =>
      typeof value === "function" || value?.isObject3D || key === "record" ? undefined : value,
    ),
  );
export async function exportProps(ctx, manifest, report) {
  manifest.props = [];
  manifest.campfires = [];
  ctx.props.group.updateMatrixWorld(true);
  const records = [...propsState.propsRuntime.recs.values()].filter((record) =>
    inside(manifest.bounds, record.x, record.z),
  );
  for (const [index, record] of records.entries()) {
    const root = new THREE.Group();
    root.name = record.entry?.name ?? record.kind;
    ctx.props.group.traverse((group) => {
      for (const range of group.userData.ranges?.get(record.tag) ?? []) {
        const geometry = rangeGeometry(range.mesh.geometry, range.start, range.count);
        geometry.applyMatrix4(range.mesh.matrixWorld);
        const mesh = new THREE.Mesh(geometry, exportMaterial(range.mesh.material));
        mesh.name = `${range.mesh.name}_${root.children.length}`;
        root.add(mesh);
      }
    });
    report(`Original prop ${index + 1}/${records.length}: ${root.name}`);
    const file = root.children.length ? await glb(`region-prop-${index}.glb`, root) : null;
    manifest.props.push({
      ...file,
      name: root.name,
      tag: record.tag,
      kind: record.kind,
      x: record.x,
      y: record.y,
      z: record.z,
      entry: simple(record.entry),
      colliders: simple(record.cols),
      walk: simple(record.walk),
      lights: simple(record.lights),
      pools: simple(record.pools),
      shade: simple(record.shade),
    });
    if (record.fire) {
      const fire = record.fire;
      const fireFile = `region-fire-${manifest.campfires.length}.json`;
      await geometryData(fireFile, fire.mesh.geometry);
      manifest.campfires.push({
        x: fire.pos.x,
        y: fire.pos.y,
        z: fire.pos.z,
        file: fireFile,
        matrix: fire.mesh.matrixWorld.toArray(),
        flames: simple(fire.flames),
        uniforms: uniforms(fire.mat.uniforms),
      });
    }
  }
  const flame = propsState.flameParticleTextureCache?.image;
  if (flame) {
    await png("region-flame.png", flame);
    manifest.flameTexture = "region-flame.png";
  }
}
