import { characters } from "./characters";

type NavigatorWithHints = Navigator & {
  userAgentData?: {
    platform?: string;
    getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }>;
  };
};

const featured = document.querySelector<HTMLImageElement>(".js-featured-pet");
const castName = document.querySelector<HTMLElement>(".js-cast-name");
const description = document.querySelector<HTMLElement>(".js-cast-description");
const counter = document.querySelector<HTMLElement>(".js-cast-count");
const thumbnails = document.querySelector<HTMLElement>(".cast-thumbnails");

function selectCharacter(index: number): void {
  const character = characters[index];
  if (!character || !featured || !castName || !description || !counter) return;
  featured.src = character.image;
  featured.alt = character.name;
  castName.textContent = character.name;
  description.textContent = character.description;
  const current = String(index + 1).padStart(2, "0");
  const total = String(characters.length).padStart(2, "0");
  counter.textContent = `${current} / ${total} previews`;
  thumbnails?.querySelectorAll("button").forEach((button, buttonIndex) => {
    button.setAttribute("aria-pressed", String(buttonIndex === index));
  });
}

async function posterFrame(source: string): Promise<string> {
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d")?.drawImage(image, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  return blob ? URL.createObjectURL(blob) : source;
}

async function initializeCharacters(): Promise<void> {
  document.querySelectorAll<HTMLElement>(".js-character-total").forEach((element) => {
    element.textContent = String(characters.length);
  });

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches) {
    const posters = await Promise.all(characters.map(({ image }) => posterFrame(image)));
    posters.forEach((poster, index) => {
      characters[index].image = poster;
    });
  }
  motion.addEventListener("change", () => window.location.reload());

  const previewPets = {
    bao: "bao-panda-chef",
    ember: "ember-fox-ronin",
    wisp: "wisp-little-ghost",
    cat: "cat",
  };
  const characterById = new Map(characters.map((character) => [character.id, character]));
  for (const [key, characterId] of Object.entries(previewPets)) {
    const image = document.querySelector<HTMLImageElement>(`[data-pet="${key}"]`);
    const character = characterById.get(characterId);
    if (image && character) image.src = character.image;
  }

  characters.forEach((character, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Preview ${character.name}`);
    button.setAttribute("aria-pressed", String(index === 0));
    const image = document.createElement("img");
    image.src = character.image;
    image.alt = "";
    button.append(image);
    button.addEventListener("click", () => selectCharacter(index));
    thumbnails?.append(button);
  });
  selectCharacter(0);
}

function platformName(): string {
  const nav = navigator as NavigatorWithHints;
  return `${nav.userAgentData?.platform ?? navigator.platform} ${navigator.userAgent}`.toLowerCase();
}

async function preferredMacDownload(): Promise<{ href: string; label: string; hint: string }> {
  const platform = platformName();
  const touchIpad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const ios = touchIpad || /iphone|ipad|ipod/.test(platform);
  if (ios || !platform.includes("mac")) {
    const os = ios
      ? "iOS or iPadOS"
      : platform.includes("win")
        ? "Windows"
        : platform.includes("linux")
          ? "Linux"
          : "your platform";
    return {
      href: "#download",
      label: "View macOS downloads",
      hint: `Detected ${os} · Pet Town currently ships for macOS only`,
    };
  }
  const nav = navigator as NavigatorWithHints;
  const values = await nav.userAgentData?.getHighEntropyValues?.(["architecture"]);
  const intel = values?.architecture?.toLowerCase().includes("x86") ?? false;
  return intel
    ? {
        href: "https://github.com/abhishek944/pet-town/releases/download/v0.1.5/Pet-Town-macOS-Intel.dmg",
        label: "Download for Intel Mac",
        hint: "Intel Mac detected · Apple Silicon option available",
      }
    : {
        href: "https://github.com/abhishek944/pet-town/releases/download/v0.1.5/Pet-Town-macOS-Apple-Silicon.dmg",
        label: "Download for macOS",
        hint: "Apple Silicon recommended · Intel option available",
      };
}

void initializeCharacters();
void preferredMacDownload().then(({ href, label, hint }) => {
  document.querySelectorAll<HTMLAnchorElement>(".js-primary-download").forEach((link) => {
    link.href = href;
    if (href.startsWith("#")) link.removeAttribute("download");
  });
  const heroLabel = document.querySelector<HTMLElement>(".js-download-label");
  const footerLabel = document.querySelector<HTMLElement>(".js-footer-download-label");
  if (heroLabel) heroLabel.textContent = label;
  if (footerLabel)
    footerLabel.textContent = href.startsWith("#")
      ? "See available Mac downloads ↓"
      : "Bring the village to your Mac ↓";
  document.querySelectorAll<HTMLElement>(".js-platform-hint").forEach((element) => {
    element.textContent = hint;
  });
});
