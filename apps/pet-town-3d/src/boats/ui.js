import "./boat.css";

export function createBoatUi(context, passengers, input) {
  const root = document.createElement("aside");
  root.className = "boat-ui";
  root.dataset.townUi = "boat";
  root.setAttribute("aria-label", "Harbor launch controls");
  root.innerHTML = `<section class="boat-voyage"><small>HARBOR LAUNCH</small>
    <h2>Take the helm</h2><p>F · take / leave helm<br>W / S · forward / reverse<br>
    A / D · steer<br>Leave the helm to walk the deck.</p>
    <div class="boat-touch" aria-label="Steering"><button data-key="KeyW" aria-label="Forward">↑</button>
    <button data-key="KeyA" aria-label="Steer left">←</button>
    <button data-key="KeyS" aria-label="Reverse">↓</button>
    <button data-key="KeyD" aria-label="Steer right">→</button></div></section>
    <button class="boat-action"><kbd>F</kbd><span>Board boat</span></button>`;
  const button = root.querySelector(".boat-action");
  const card = root.querySelector(".boat-voyage");
  const heading = card.querySelector("h2");
  const caption = button.querySelector("span");
  button.onclick = () => {
    if (!input.blocked()) {
      input.clear();
      passengers.action()?.run();
    }
  };
  for (const control of root.querySelectorAll("[data-key]")) {
    control.addEventListener("pointerdown", (event) => {
      if (input.blocked()) return;
      event.preventDefault();
      control.setPointerCapture(event.pointerId);
      input.touch.add(control.dataset.key);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      control.addEventListener(type, () => input.touch.delete(control.dataset.key));
  }
  for (const type of ["pointerdown", "mousedown", "click", "wheel"])
    root.addEventListener(type, (event) => event.stopPropagation());
  document.body.append(root);
  return {
    update() {
      root.style.width = `${context.viewport?.width ?? innerWidth}px`;
      const action = input.blocked() ? null : passengers.action();
      root.hidden = !action || context.hud?.hidden || context.hud?.photoMode;
      root.inert = root.hidden;
      if (!action) return;
      caption.textContent = action.label;
      button.setAttribute("aria-label", `${action.label} (F or gamepad Y)`);
      card.hidden = !passengers.aboard(passengers.active());
      heading.textContent = passengers.pilot ? "At the helm" : "Take the helm";
      card.querySelector(".boat-touch").hidden = !passengers.pilot;
    },
    dispose() {
      root.remove();
    },
  };
}
