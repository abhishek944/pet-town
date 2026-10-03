type Preview = HTMLVideoElement | HTMLImageElement;
type MotionState = { visible: boolean; failed: boolean; revision: number };

/** Real recordings share one motion preference; posters remain useful without scripts. */
export function initializeMotionPreviews(): void {
  const media = [...document.querySelectorAll<Preview>("[data-motion-media]")];
  const controls = [...document.querySelectorAll<HTMLButtonElement>(".js-motion-toggle")];
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let enabled = !preference.matches && !connection?.saveData;
  const states = new Map<Preview, MotionState>(
    media.map((item) => [item, { visible: false, failed: false, revision: 0 }]),
  );

  function controlsChanged(): void {
    controls.forEach((button) => {
      button.textContent = enabled ? "Ⅱ Pause previews" : "▶ Play previews";
      button.setAttribute(
        "aria-label",
        enabled ? "Pause all gameplay previews" : "Play all gameplay previews",
      );
    });
  }
  function update(item: Preview): void {
    const state = states.get(item)!;
    const active = enabled && state.visible && !document.hidden && !state.failed;
    const source = item.dataset.motionSrc;
    if (item instanceof HTMLImageElement) {
      const target = active ? source : item.dataset.poster;
      if (target && item.src !== new URL(target, document.baseURI).href) item.src = target;
      return;
    }
    if (!active || !source) {
      state.revision++;
      item.pause();
      return;
    }
    if (item.src !== new URL(source, document.baseURI).href) {
      state.revision++;
      item.muted = true;
      item.src = source;
    }
    if (!item.paused) return;
    const revision = ++state.revision;
    void item.play().catch(() => {
      if (
        state.revision !== revision ||
        state.failed ||
        !enabled ||
        !state.visible ||
        document.hidden
      )
        return;
      enabled = false;
      synchronize();
    });
  }
  function synchronize(): void {
    controlsChanged();
    media.forEach(update);
  }
  for (const item of media) {
    item.addEventListener("error", () => {
      const state = states.get(item)!;
      state.failed = true;
      if (item instanceof HTMLVideoElement) {
        item.closest(".gameplay-stage")?.setAttribute("data-preview-failed", "true");
        enabled = false;
        controlsChanged();
        item.pause();
        item.removeAttribute("src");
        item.load();
        const message = document.querySelector<HTMLElement>(".preview-status");
        if (message)
          message.textContent = "This preview couldn’t play. You can still enter the town below.";
        synchronize();
      } else if (
        item.dataset.poster &&
        item.src !== new URL(item.dataset.poster, document.baseURI).href
      ) {
        item.src = item.dataset.poster;
      }
    });
  }
  controls.forEach((button) =>
    button.addEventListener("click", () => {
      enabled = !enabled;
      if (enabled) {
        states.forEach((state) => {
          state.failed = false;
        });
        document.querySelector(".gameplay-stage")?.removeAttribute("data-preview-failed");
        const message = document.querySelector<HTMLElement>(".preview-status");
        if (message) message.textContent = "";
      }
      synchronize();
    }),
  );
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          states.get(entry.target as Preview)!.visible = entry.isIntersecting;
          update(entry.target as Preview);
        });
      },
      { threshold: 0.08 },
    );
    media.forEach((item) => observer.observe(item));
  } else
    media.forEach((item) => {
      states.get(item)!.visible = true;
    });
  preference.addEventListener("change", () => {
    enabled = !preference.matches && !connection?.saveData;
    synchronize();
  });
  document.addEventListener("visibilitychange", synchronize);
  window.addEventListener("gameplay-clip-change", () => {
    const featured = document.querySelector<HTMLVideoElement>("#hero-gameplay");
    if (!featured) return;
    const state = states.get(featured)!;
    state.revision++;
    state.failed = false;
    featured.closest(".gameplay-stage")?.removeAttribute("data-preview-failed");
    featured.pause();
    featured.removeAttribute("src");
    featured.load();
    const message = document.querySelector<HTMLElement>(".preview-status");
    if (message) message.textContent = "";
    update(featured);
  });
  synchronize();
}
