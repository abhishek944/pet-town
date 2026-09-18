import type { IntentResolution } from "@pet-village/core";

export function installPaletteInput(
  input: HTMLInputElement | null,
  state: () => { open: boolean; mode: "request" | "actions"; resolution: IntentResolution | null },
  naturalLanguageEnabled: () => boolean,
  openRequest: () => void,
  close: () => void,
  submitReady: () => void,
  runMenuIndex: (index: number) => void,
  render: () => void,
): void {
  window.addEventListener("keydown", (event) => {
    const current = state();
    if (event.key === "/" && !current.open && naturalLanguageEnabled()) {
      event.preventDefault();
      openRequest();
    } else if (event.key === "Escape" && current.open) close();
    else if (
      event.key === "Enter" &&
      current.open &&
      current.mode === "request" &&
      current.resolution?.status === "ready"
    )
      submitReady();
    else if (current.open && current.mode === "actions" && /^[1-9]$/.test(event.key))
      runMenuIndex(Number(event.key) - 1);
  });
  input?.addEventListener("input", render);
}
