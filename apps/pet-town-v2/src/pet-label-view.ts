import { vec, type Engine } from "excalibur";
import { pruneSuppressed, suppressFocus } from "./agent-focus";
import type { PetActor } from "./game-types";
import type { V2Preferences } from "./preferences";
import { petLabelText } from "./pet-label";
import { petWithFallback } from "./pets";

type PetNodes = { wrapper: HTMLElement; sprite: HTMLElement; chip: HTMLElement; key: string };

const DRAG_PX = 4;

export class PetDomView {
  readonly #pets = new Map<string, PetNodes>();
  #actors: Map<string, PetActor> = new Map();
  #pointerId: number | null = null;
  #dragId: string | null = null;
  #startX = 0;
  #grabDX = 0;
  #dragging = false;

  constructor(
    readonly root: HTMLElement | null,
    readonly engine: Engine,
    readonly focus: (id: string) => void,
    readonly openMenu: (id: string, x: number, y: number) => void,
  ) {
    window.addEventListener("pointermove", (event) => this.#onMove(event));
    window.addEventListener("pointerup", (event) => this.#onUp(event));
    window.addEventListener("pointercancel", (event) => this.#onUp(event));
    window.addEventListener("lostpointercapture", (event) => this.#onUp(event as PointerEvent));
  }

  update(actors: Map<string, PetActor>, prefs: V2Preferences, paletteOpen: boolean): void {
    if (!this.root) return;
    this.#actors = actors;
    pruneSuppressed(actors.keys());
    if (this.#dragId && !actors.has(this.#dragId)) this.#finishDrag();
    if (paletteOpen) {
      for (const pet of actors.values()) pet.dragging = false;
      return this.#clear();
    }
    for (const [id, nodes] of this.#pets) {
      if (!actors.has(id)) {
        nodes.wrapper.remove();
        nodes.chip.remove();
        this.#pets.delete(id);
      }
    }
    for (const [id, pet] of actors) {
      let nodes = this.#pets.get(id);
      if (!nodes && this.root) {
        nodes = this.#create(this.root, id);
        this.#pets.set(id, nodes);
      }
      if (!nodes) continue;
      this.#syncSprite(nodes, pet, prefs.reducedMotion);
      this.#syncChip(nodes, pet, prefs.showLabels);
    }
  }

  #create(root: HTMLElement, id: string): PetNodes {
    const wrapper = document.createElement("div");
    wrapper.className = "pet-sprite-wrap";
    const sprite = document.createElement("div");
    sprite.className = "pet-sprite";
    sprite.addEventListener("click", (event) => {
      if (event.button === 0) this.focus(id);
    });
    sprite.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.openMenu(id, event.clientX, event.clientY);
    });
    const down = (event: PointerEvent): void => this.#onDown(event, id);
    sprite.addEventListener("pointerdown", down);
    const chip = document.createElement("div");
    chip.className = "pet-label-chip";
    chip.setAttribute("aria-hidden", "true");
    chip.addEventListener("pointerdown", down);
    chip.addEventListener("click", (event) => {
      if (event.button === 0) this.focus(id);
    });
    chip.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.openMenu(id, event.clientX, event.clientY);
    });
    wrapper.append(sprite);
    root.append(wrapper, chip);
    return { wrapper, sprite, chip, key: "" };
  }

  #syncSprite(nodes: PetNodes, pet: PetActor, reducedMotion: boolean): void {
    const definition = petWithFallback(pet.agent.petId);
    const asset = definition.assets[pet.activeKey as keyof typeof definition.assets];
    const assetId = asset ? `${asset.path}:${asset.frames}:${asset.frameDuration}` : "none";
    const key = `${pet.activeKey}:${assetId}:${pet.visualWidth}x${pet.visualHeight}:${pet.direction}:${reducedMotion}`;
    const world = this.engine.screen.worldToScreenCoordinates(pet.actor.pos);
    nodes.wrapper.style.transform = `translate(${world.x.toFixed(1)}px, ${world.y.toFixed(1)}px)`;
    nodes.sprite.style.width = `${pet.visualWidth.toFixed(1)}px`;
    nodes.sprite.style.height = `${pet.visualHeight.toFixed(1)}px`;
    if (key === nodes.key) return;
    nodes.key = key;
    nodes.sprite.style.backgroundImage = asset ? `url("${asset.path}")` : "none";
    nodes.sprite.style.backgroundSize = `${(asset?.frames ?? 1) * 100}% 100%`;
    nodes.sprite.style.setProperty("--w", `${pet.visualWidth.toFixed(1)}px`);
    nodes.sprite.style.setProperty("--n", `${asset?.frames ?? 1}`);
    if (reducedMotion || !asset || asset.frames < 2) {
      nodes.sprite.style.animation = "none";
      nodes.sprite.style.backgroundPositionX = "0";
    } else {
      const total = asset.frames * asset.frameDuration;
      const repeat = pet.activeKey === "wave" ? 1 : "infinite";
      nodes.sprite.style.animation = `pet-frames ${total}ms steps(${asset.frames}) ${repeat}`;
    }
    nodes.sprite.style.setProperty("--flip", pet.direction < 0 ? "-1" : "1");
  }

  #syncChip(nodes: PetNodes, pet: PetActor, showLabels: boolean): void {
    if (!showLabels) {
      nodes.chip.remove();
      return;
    }
    if (!nodes.chip.isConnected) this.root?.append(nodes.chip);
    const text = petLabelText(pet.agent, pet.labelChars);
    if (nodes.chip.textContent !== text) nodes.chip.textContent = text;
    nodes.chip.style.width = `${pet.labelWidth}px`;
    const world = pet.actor.pos.add(pet.label.pos);
    const screen = this.engine.screen.worldToScreenCoordinates(world);
    nodes.chip.style.transform = `translate(${screen.x.toFixed(1)}px, ${screen.y.toFixed(1)}px) translate(-50%, -50%)`;
  }

  #clear(): void {
    this.#finishDrag();
    for (const [id, nodes] of this.#pets) {
      nodes.wrapper.remove();
      nodes.chip.remove();
      this.#pets.delete(id);
    }
  }

  #onDown(event: PointerEvent, id: string): void {
    if (event.button !== 0 || this.#dragId || !this.#actors.has(id)) return;
    try {
      if (event.target instanceof Element) event.target.setPointerCapture(event.pointerId);
    } catch {
      // A released or synthetic pointer cannot be captured; the drag still works.
    }
    this.#pointerId = event.pointerId;
    this.#dragId = id;
    this.#startX = event.clientX;
    this.#dragging = false;
  }

  #onMove(event: PointerEvent): void {
    if (event.pointerId !== this.#pointerId || !this.#dragId) return;
    const pet = this.#actors.get(this.#dragId);
    if (!pet) return this.#finishDrag();
    if (!this.#dragging) {
      if (Math.abs(event.clientX - this.#startX) < DRAG_PX) return;
      this.#dragging = true;
      pet.dragging = true;
      const origin = this.engine.screen.worldToScreenCoordinates(pet.actor.pos).x;
      this.#grabDX = this.#startX - origin;
      document.body.style.cursor = "grabbing";
    }
    event.preventDefault();
    const half = pet.visualWidth / 2;
    const world = this.engine.screen.screenToWorldCoordinates(vec(event.clientX - this.#grabDX, 0));
    const clamped = Math.max(half, Math.min(this.engine.drawWidth - half, world.x));
    pet.actor.pos = vec(clamped, pet.actor.pos.y);
  }

  #onUp(event: PointerEvent): void {
    if (event.pointerId !== this.#pointerId) return;
    this.#finishDrag();
  }

  #finishDrag(): void {
    const pet = this.#dragId ? this.#actors.get(this.#dragId) : undefined;
    if (pet) pet.dragging = false;
    if (this.#dragging && this.#dragId) suppressFocus(this.#dragId);
    this.#pointerId = null;
    this.#dragId = null;
    this.#dragging = false;
    document.body.style.cursor = "";
  }
}
