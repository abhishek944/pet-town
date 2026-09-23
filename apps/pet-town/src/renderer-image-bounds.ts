interface VisibleBoundsRatios { top: number; bottom: number }
const visibleBoundsByAsset = new Map<string, VisibleBoundsRatios>();

export function visibleBoundsRatios(image: HTMLImageElement, assetUrl: string): VisibleBoundsRatios {
  const cached = visibleBoundsByAsset.get(assetUrl);
  if (cached) return cached;
  const empty = { top: 0, bottom: 0 };
  try {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context || canvas.height < 1) return empty;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let top = canvas.height;
    let bottom = -1;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (pixels[(y * canvas.width + x) * 4 + 3] <= 8) continue;
        top = Math.min(top, y);
        bottom = y;
        break;
      }
    }
    const ratios = bottom < 0 ? empty : {
      top: top / canvas.height,
      bottom: (canvas.height - bottom - 1) / canvas.height,
    };
    visibleBoundsByAsset.set(assetUrl, ratios);
    return ratios;
  } catch {
    return empty;
  }
}

export function refreshCitizenLabelPosition(element: HTMLElement): void {
  const pet = element.querySelector<HTMLImageElement>("img.pet");
  const project = element.querySelector<HTMLElement>(".project");
  const stack = element.querySelector<HTMLElement>(".pet-stack");
  if (!pet || !project || !stack || typeof pet.getBoundingClientRect !== "function") return;
  const height = pet.getBoundingClientRect().height;
  const top = Number(pet.dataset.visibleTopRatio ?? 0);
  const bottom = Number(pet.dataset.visibleBottomRatio ?? 0);
  if (Number.isFinite(top)) project.style.setProperty("--label-offset-y", `${(height * top).toFixed(2)}px`);
  if (Number.isFinite(bottom)) stack.style.setProperty("--foot-offset-y", `${(height * bottom).toFixed(2)}px`);
}
