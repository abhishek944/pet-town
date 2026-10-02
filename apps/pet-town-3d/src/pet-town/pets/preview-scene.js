import {
  ACESFilmicToneMapping,
  CylinderGeometry,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PCFShadowMap,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { disposePetResources } from "./dispose.js";

export function petRenderer(width, height) {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  return renderer;
}

export function petStudio() {
  const scene = new Scene();
  scene.add(new HemisphereLight("#fff8e2", "#8c9784", 2.8));
  const sun = new DirectionalLight("#fff1da", 3.5);
  sun.position.set(-3, 5, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2 });
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  const fill = new DirectionalLight("#dae9e8", 1.7);
  fill.position.set(3, 2, -3);
  scene.add(fill);
  const disk = new Mesh(
    new CylinderGeometry(0.46, 0.47, 0.045, 40),
    new MeshStandardMaterial({ color: "#e7dfc7", roughness: 0.82 }),
  );
  disk.position.y = -0.013;
  disk.receiveShadow = true;
  scene.add(disk);
  const floor = new Mesh(new PlaneGeometry(13, 13), new ShadowMaterial({ opacity: 0.13 }));
  floor.position.y = -0.04;
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const camera = new OrthographicCamera(-1, 1, 0.96, -0.96, 0.1, 100);
  camera.position.set(1.664, 1.824, 3.84);
  camera.lookAt(0, 0.768, 0);
  return {
    scene,
    camera,
    resize(width, height) {
      camera.left = (-0.96 * width) / height;
      camera.right = -camera.left;
      camera.updateProjectionMatrix();
    },
    dispose() {
      sun.shadow.dispose();
      disposePetResources(disk, floor);
      scene.clear();
    },
  };
}
