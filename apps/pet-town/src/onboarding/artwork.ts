export async function freezeArtwork(root: HTMLElement): Promise<void> {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const image of root.querySelectorAll<HTMLImageElement>('img[src*="nib-"]')) {
    try {
      await image.decode();
      if (!image.isConnected) continue;
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.className = image.className + " frozen-art";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", image.alt);
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      image.replaceWith(canvas);
    } catch {
      /* The text state remains available if art fails. */
    }
  }
}
