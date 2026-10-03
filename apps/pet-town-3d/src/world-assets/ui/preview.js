import * as T from "three";
import { createAssetModel } from "../../props/collection/model.js";

/** One preview renderer; selected models own geometry but share the town's materials. */
export function createLibraryPreview(host) {
  let renderer;
  let model;
  let selected;
  let rotation;
  let dirty = true;
  let failed = false;
  const scene = new T.Scene();
  scene.background = new T.Color("#eaf0d9");
  const camera = new T.PerspectiveCamera(36, 1, 0.1, 150);
  scene.add(new T.HemisphereLight(0xfff8dc, 0x567852, 2.05));
  const sun = new T.DirectionalLight(0xffebc0, 3.5);
  sun.position.set(-8, 15, 9);
  scene.add(sun);
  const pedestal = new T.Mesh(
    new T.CylinderGeometry(1, 1.04, 0.15, 48),
    new T.MeshStandardMaterial({ color: 0x78995d, roughness: 0.85 }),
  );
  scene.add(pedestal);
  function releaseModel() {
    if (!model) return;
    const geometries = new Set();
    model.traverse((part) => {
      if (part.geometry) geometries.add(part.geometry);
    });
    for (const geometry of geometries) geometry.dispose();
    scene.remove(model);
    model = null;
  }
  function initialise() {
    if (renderer || failed) return;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.28;
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.append(renderer.domElement);
    } catch {
      failed = true;
      host.textContent =
        "The 3D preview is unavailable on this device. Reopen the town to try again.";
    }
  }
  function select(asset) {
    releaseModel();
    selected = asset.id;
    model = createAssetModel(asset.id);
    scene.add(model);
    const bounds = new T.Box3().setFromObject(model);
    const center = bounds.getCenter(new T.Vector3());
    const size = bounds.getSize(new T.Vector3());
    model.position.set(-center.x, -bounds.min.y, -center.z);
    const extent = Math.max(size.x, size.y, size.z, 1);
    const target = new T.Vector3(0, size.y * 0.45, 0);
    camera.position.copy(target).add(new T.Vector3(1.05, 0.67, 1.4).multiplyScalar(extent * 1.65));
    camera.lookAt(target);
    pedestal.scale.set(Math.max(size.x, size.z) * 0.66, 1, Math.max(size.x, size.z) * 0.66);
    pedestal.position.y = -0.09;
    dirty = true;
  }
  const observer = new ResizeObserver(() => {
    dirty = true;
  });
  observer.observe(host);
  return {
    update(asset, angle) {
      initialise();
      if (!renderer || !asset) return;
      try {
        if (selected !== asset.id) select(asset);
        if (rotation !== angle) {
          rotation = angle;
          dirty = true;
        }
        if (!dirty || host.clientWidth < 1 || host.clientHeight < 1) return;
        model.rotation.y = angle;
        camera.aspect = host.clientWidth / host.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(host.clientWidth, host.clientHeight, false);
        renderer.render(scene, camera);
        dirty = false;
      } catch {
        host.dataset.failed = "true";
        host.setAttribute("aria-label", "Selected asset preview could not be drawn");
      }
    },
    dispose() {
      observer.disconnect();
      releaseModel();
      pedestal.geometry.dispose();
      pedestal.material.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      host.replaceChildren();
    },
  };
}
