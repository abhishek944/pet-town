import { createPetCharacter } from "./character.js";
import { petRenderer, petStudio } from "./preview-scene.js";
export { createPetPortrait } from "./portrait.js";

export function createPetPreview(container, petId) {
  let pet = createPetCharacter(petId);
  let renderer;
  let studio;
  try {
    renderer = petRenderer(320, 240);
    studio = petStudio();
  } catch (error) {
    pet.dispose();
    renderer?.dispose();
    throw error;
  }
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;object-fit:contain";
  container.append(renderer.domElement);
  studio.scene.add(pet.root);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let active = false;
  let disposed = false;
  let raf = 0;
  let last = 0;
  let angle = 0.2;
  let targetAngle = angle;
  function render() {
    pet.root.rotation.y = angle;
    renderer.render(studio.scene, studio.camera);
  }
  function draw(time) {
    raf = 0;
    if (!active || disposed || document.hidden) return;
    const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
    last = time;
    angle += (targetAngle - angle) * (1 - Math.exp(-8 * dt));
    pet.update(dt, { speed: 0, onGround: true });
    render();
    raf = requestAnimationFrame(draw);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    if (!active || disposed || document.hidden) return;
    if (reducedMotion.matches) render();
    else raf = requestAnimationFrame(draw);
  }
  function resize() {
    if (disposed) return;
    const width = Math.max(1, container.clientWidth || 320);
    const height = Math.max(1, container.clientHeight || 240);
    renderer.setSize(width, height, false);
    studio.resize(width, height);
    if (active && !document.hidden) render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  document.addEventListener("visibilitychange", sync);
  reducedMotion.addEventListener("change", sync);
  resize();
  return {
    setPet(id) {
      if (disposed) return;
      const next = createPetCharacter(id);
      pet.dispose();
      renderer.renderLists.dispose();
      pet = next;
      studio.scene.add(pet.root);
      angle = targetAngle = 0.2;
      last = 0;
      if (active && !document.hidden) render();
    },
    setActive(value) {
      const next = Boolean(value);
      if (active === next || disposed) return;
      active = next;
      sync();
    },
    turn() {
      if (disposed) return;
      targetAngle += Math.PI;
      if (reducedMotion.matches) angle = targetAngle;
      if (active && !document.hidden) render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
      pet.dispose();
      studio.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
