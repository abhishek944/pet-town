import { waitForStudioImages } from "./settings-studio-media";

export async function renderFrameGrid(id: string, sources: readonly string[]): Promise<void> {
  const root = document.getElementById(id)!;
  const entries = sources.map((source, index) => {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    const caption = document.createElement("figcaption");
    image.src = source;
    image.alt = `Generated animation frame ${index + 1} of ${sources.length}`;
    caption.textContent = `Frame ${index + 1}`;
    figure.append(image, caption);
    return { figure, image };
  });
  root.replaceChildren(...entries.map(({ figure }) => figure));
  root.dataset.ready = "false";
  if (!entries.length) return;
  await waitForStudioImages(entries.map(({ image }) => image));
  if (entries.every(({ figure }) => figure.parentElement === root)) root.dataset.ready = "true";
}
