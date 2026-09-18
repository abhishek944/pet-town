import { Actor, Animation, Engine, ImageSource, SpriteSheet } from "excalibur";
import { range, vec } from "excalibur";
import type { AgentView } from "@pet-village/core";
import { ACTIVE_PET_ID, PETS, type AnimationAsset } from "./pets";
import type { V2Preferences } from "./preferences";
import { PET_LABEL_HEIGHT, type PetActor } from "./game-types";
import { petLabelText, petLabelWidth } from "./pet-label";

const BASE_WIDTH = 44;
export class PetGraphics {
  readonly #sources = new Map<string, ImageSource>();

  constructor(readonly engine: Engine) {
    for (const pet of Object.values(PETS)) {
      for (const asset of Object.values(pet.assets)) {
        if (asset && !this.#sources.has(asset.path))
          this.#sources.set(asset.path, new ImageSource(asset.path));
      }
    }
  }

  async load(): Promise<void> {
    await Promise.all([...this.#sources.values()].map((source) => source.load()));
  }

  async refresh(actors: Iterable<PetActor>, preferences: V2Preferences): Promise<void> {
    const added: ImageSource[] = [];
    for (const pet of Object.values(PETS)) {
      for (const asset of Object.values(pet.assets)) {
        if (!asset || this.#sources.has(asset.path)) continue;
        const source = new ImageSource(asset.path);
        this.#sources.set(asset.path, source);
        added.push(source);
      }
    }
    await Promise.all(added.map((source) => source.load()));
    for (const actor of actors) {
      actor.animations.clear();
      const pet = PETS[actor.agent.petId] ?? PETS[ACTIVE_PET_ID];
      for (const [key, asset] of Object.entries(pet.assets))
        if (asset) actor.animations.set(key, this.#animation(asset, preferences));
      this.restore(actor, preferences);
    }
  }

  create(
    agent: AgentView,
    x: number,
    baseline: number,
    preferences: V2Preferences,
  ): PetActor | null {
    const pet = PETS[agent.petId] ?? PETS[ACTIVE_PET_ID];
    const actor = new Actor({
      pos: vec(x, baseline),
      width: 88,
      height: 112,
      anchor: vec(0.5, 1),
      z: 5,
    });
    const animations = new Map<string, Animation>();
    for (const [key, asset] of Object.entries(pet.assets))
      if (asset) animations.set(key, this.#animation(asset, preferences));
    const labelWidth = petLabelWidth(petLabelText(agent, 16));
    const label = new Actor({
      pos: vec(0, -100),
      width: labelWidth,
      height: PET_LABEL_HEIGHT,
      z: 7,
    });
    label.graphics.visible = false;
    const direction =
      agent.id.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % 2 === 0
        ? 1
        : -1;
    const petActor: PetActor = {
      actor,
      label,
      agent,
      animations,
      layoutScale: 1,
      labelChars: 16,
      direction,
      activeKey: "walk",
      visualWidth: 88,
      visualHeight: 112,
      labelWidth,
      positioned: false,
    };
    this.restore(petActor, preferences);
    actor.addChild(label);
    this.engine.add(actor);
    return petActor;
  }

  updateLayout(
    pet: PetActor,
    x: number,
    baseline: number,
    layoutScale: number,
    labelChars: number,
    preferences: V2Preferences,
  ): void {
    pet.layoutScale = layoutScale;
    pet.labelChars = labelChars;
    pet.actor.pos = vec(x, baseline);
    pet.positioned = true;
    this.updateLabel(pet);
    this.applyPreferences(pet, preferences);
  }

  updateLabel(pet: PetActor): void {
    const text = petLabelText(pet.agent, pet.labelChars);
    pet.labelWidth = petLabelWidth(text);
    pet.label.collider.useBoxCollider(pet.labelWidth, PET_LABEL_HEIGHT);
  }

  setDirection(pet: PetActor, direction: -1 | 1): void {
    pet.direction = direction;
    for (const animation of pet.animations.values()) animation.flipHorizontal = direction < 0;
  }

  restore(pet: PetActor, preferences: V2Preferences): void {
    const key =
      pet.agent.state === "blocked" ? "wave" : pet.agent.state === "done" ? "done" : "walk";
    this.useCapability(pet, key, preferences);
  }

  useCapability(pet: PetActor, requestedKey: string, preferences: V2Preferences): void {
    pet.activeKey = pet.animations.has(requestedKey) ? requestedKey : "walk";
    this.applyPreferences(pet, preferences);
  }

  applyPreferences(pet: PetActor, preferences: V2Preferences): void {
    const definition = PETS[pet.agent.petId] ?? PETS[ACTIVE_PET_ID];
    for (const [key, animation] of pet.animations) {
      const asset =
        definition.assets[key as keyof typeof definition.assets] ?? definition.assets.walk;
      const scale =
        (BASE_WIDTH * preferences.petScale * pet.layoutScale) / (100 * (asset?.frameWidth ?? 240));
      animation.scale = vec(scale, scale);
      animation.flipHorizontal = pet.direction < 0;
      if (preferences.reducedMotion) animation.pause();
      else animation.play();
    }
    pet.label.graphics.visible = preferences.showLabels;
    this.#updateMetrics(pet, preferences);
  }

  #updateMetrics(pet: PetActor, preferences: V2Preferences): void {
    const definition = PETS[pet.agent.petId] ?? PETS[ACTIVE_PET_ID];
    const asset =
      definition.assets[pet.activeKey as keyof typeof definition.assets] ?? definition.assets.walk;
    const scale =
      (BASE_WIDTH * preferences.petScale * pet.layoutScale) / (100 * (asset?.frameWidth ?? 240));
    pet.visualWidth = (asset?.frameWidth ?? 240) * scale;
    pet.visualHeight = (asset?.frameHeight ?? 240) * scale;
    pet.actor.collider.useBoxCollider(pet.visualWidth, pet.visualHeight, vec(0.5, 1));
    pet.label.pos = vec(0, -pet.visualHeight - 10);
  }

  #animation(asset: AnimationAsset, preferences: V2Preferences): Animation {
    const source = this.#sources.get(asset.path);
    if (!source) throw new Error(`Missing sprite source: ${asset.path}`);
    const sheet = SpriteSheet.fromImageSource({
      image: source,
      grid: {
        rows: 1,
        columns: asset.frames,
        spriteWidth: asset.frameWidth,
        spriteHeight: asset.frameHeight,
      },
    });
    const animation = Animation.fromSpriteSheet(
      sheet,
      range(0, asset.frames - 1),
      asset.frameDuration,
    );
    const scale = (BASE_WIDTH * preferences.petScale) / (100 * asset.frameWidth);
    animation.scale = vec(scale, scale);
    return animation;
  }
}
