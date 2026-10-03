import { cameraMeshSource } from "./camera-query-mesh.js";
import { cameraTreeMatrix } from "./camera-query-tree-matrix.js";

const solidMaterialMesh =
  /^props_(wood|paint|brick|shingle|stone|plaster|rock|soil|metal|plain|glass)$/;

// Camera solids use rendered surfaces, never the actor's inflated fence/roof proxies.
export function collectCameraQuerySources(state) {
  const { context, identity, descriptors } = state;
  const sources = [];
  const add = (source) => {
    if (source) {
      source.currentGeometry ??= () => source.mesh.geometry;
      sources.push(source);
    }
  };
  context.terrain?.group?.updateWorldMatrix(true, true);
  for (const mesh of context.terrain?.group?.children ?? []) {
    if (mesh.isMesh && mesh.visible && mesh.name.startsWith("chunk_")) {
      add(
        cameraMeshSource(
          mesh,
          mesh.geometry,
          mesh.matrixWorld,
          mesh.name,
          "terrain",
          0,
          undefined,
          descriptors,
        ),
      );
    }
  }
  context.props?.group?.updateWorldMatrix(true, true);
  const published = new Set();
  const groups = [];
  context.props?.group?.traverseVisible((object) => groups.push(object));
  for (const group of groups) {
    if (!group.userData.ranges) continue;
    for (const [tag, ranges] of group.userData.ranges) {
      for (const range of ranges) {
        const mesh = range.mesh;
        published.add(mesh);
        // Leaves and decorative cloth remain visibility effects, not boom walls.
        if (
          range.hidden ||
          !mesh.visible ||
          !solidMaterialMesh.test(mesh.name) ||
          mesh.material?.isShaderMaterial ||
          mesh.geometry?.isInstancedBufferGeometry
        )
          continue;
        add(
          cameraMeshSource(
            mesh,
            mesh.geometry,
            mesh.matrixWorld,
            `prop:${tag}`,
            "prop",
            range.start,
            range.count,
            descriptors,
            range,
          ),
        );
      }
    }
  }
  for (const mesh of groups) {
    // Windmill wood/metal is published in a separate moving group without tags.
    // Restrict the fallback to prop material meshes: fire/decals remain effects.
    if (!mesh.isMesh || published.has(mesh) || !solidMaterialMesh.test(mesh.name)) continue;
    if (
      mesh.material?.isShaderMaterial ||
      mesh.geometry?.isInstancedBufferGeometry ||
      mesh.isInstancedMesh
    )
      continue;
    add(
      cameraMeshSource(
        mesh,
        mesh.geometry,
        mesh.matrixWorld,
        `prop:${mesh.uuid}`,
        "prop",
        0,
        undefined,
        descriptors,
      ),
    );
  }
  context.boats?.group?.updateWorldMatrix(true, true);
  context.boats?.group?.traverseVisible((mesh) => {
    if (mesh.isMesh)
      add(
        cameraMeshSource(
          mesh,
          mesh.geometry,
          mesh.matrixWorld,
          `boat:${mesh.uuid}`,
          "prop",
          0,
          undefined,
          descriptors,
        ),
      );
  });
  context.vegetation?.group?.updateWorldMatrix(true, false);
  const updatedMeshes = new Set();
  for (const tree of context.vegetation?.trees ?? []) {
    const part = tree.parts?.[0];
    if (!part || part.hidden) continue;
    const geometry = part.field?.geo;
    const mesh = part.mesh;
    if (!geometry || !mesh) continue;
    if (!updatedMeshes.has(mesh)) {
      mesh.updateWorldMatrix(true, false);
      updatedMeshes.add(mesh);
    }
    const pose = cameraTreeMatrix(state, tree, part, mesh);
    const source = cameraMeshSource(
      mesh,
      geometry,
      pose.matrix,
      `tree:${identity(tree)}`,
      "vegetation",
      0,
      undefined,
      descriptors,
    );
    if (source) {
      source.tree = tree;
      source.currentGeometry ??= () => tree.parts?.[0]?.field?.geo;
      source.currentPose = pose.current;
      add(source);
    }
  }
  return sources;
}

export function refreshCameraQuerySource(state, old) {
  const part = old.tree?.parts?.[0];
  const mesh = part?.mesh ?? old.mesh;
  const pose = part ? cameraTreeMatrix(state, old.tree, part, mesh) : null;
  const source = cameraMeshSource(
    mesh,
    old.currentGeometry(),
    pose?.matrix ?? mesh.matrixWorld,
    old.ownerId,
    old.kind,
    old.start,
    old.rangeCount,
    state.descriptors,
    old.range,
  );
  if (!source) return null;
  source.tree = old.tree;
  source.currentGeometry = old.currentGeometry;
  source.currentPose = pose?.current;
  return source;
}
