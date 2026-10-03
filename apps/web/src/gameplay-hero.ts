const moments = {
  town: {
    title: "Take the scenic route.",
    copy: "A living little world, ready when you need a break.",
    label: "Recorded solo town panorama",
  },
  wildlife: {
    title: "Make a little friend.",
    copy: "Walk up, say hello, and watch the hearts appear.",
    label: "Recorded native creature petting",
  },
  jump: {
    title: "A little room for play.",
    copy: "Run through the paths. Jump just because you can.",
    label: "Recorded running and jumping in the town",
  },
};

export function initializeGameplayHero(): void {
  const video = document.querySelector<HTMLVideoElement>("#hero-gameplay");
  const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-featured-clip]")];
  if (!video) return;
  for (const button of buttons)
    button.addEventListener("click", () => {
      const key = button.dataset.featuredClip as keyof typeof moments;
      const moment = moments[key];
      if (!moment || button.getAttribute("aria-pressed") === "true") return;
      buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      video.dataset.motionSrc = `${import.meta.env.BASE_URL}media/gameplay/${key}.mp4`;
      video.poster = `${import.meta.env.BASE_URL}media/gameplay/${key}-poster.jpg`;
      video.setAttribute("aria-label", moment.label);
      const title = document.querySelector("#clip-title");
      const copy = document.querySelector("#clip-copy");
      if (title) title.textContent = moment.title;
      if (copy) copy.textContent = moment.copy;
      window.dispatchEvent(new Event("gameplay-clip-change"));
    });
}
