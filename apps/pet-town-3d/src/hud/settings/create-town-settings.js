import markup from "./settings.html?raw";
import styles from "./settings.css?raw";
import { installGameStyles } from "../../core/install-game-styles.js";
import { bindCompanionControls } from "./companion-controls.js";
import { showWorldResetConfirmation } from "../modals/show-world-reset-confirmation.js";
import { hudState } from "../state.js";
import { isPublicTown } from "../../core/runtime-mode.js";
import { configurePublicSettings } from "../../public-town/settings.js";

export function createTownSettings(context, close) {
  installGameStyles("town-settings-css", styles);
  const template = document.createElement("template");
  template.innerHTML = markup;
  const root = template.content.firstElementChild;
  const companions = isPublicTown
    ? configurePublicSettings(root)
    : bindCompanionControls(root, context);
  const tabs = [...root.querySelectorAll("[role=tab]")];
  let active = isPublicTown ? "world" : "companion";
  const control = (name) => root.querySelector(`[data-control="${name}"]`);
  const mute = control("mute");
  const volume = control("volume");
  root.querySelector("[data-a=close]").onclick = close;
  function selectTab(name, focus = false) {
    active = name;
    for (const tab of tabs) {
      tab.setAttribute("aria-selected", String(tab.dataset.tab === name));
      tab.tabIndex = tab.dataset.tab === name ? 0 : -1;
      if (focus && tab.tabIndex === 0) tab.focus();
    }
    for (const panel of root.querySelectorAll("[role=tabpanel]"))
      panel.hidden = panel.dataset.panel !== name;
    root.querySelector(".settings-body").scrollTop = 0;
    companions.setVisible?.(!root.hidden && active === "companion");
  }
  for (const tab of tabs) {
    tab.onclick = () => selectTab(tab.dataset.tab);
    tab.onkeydown = (event) => {
      const i = tabs.indexOf(tab);
      const next = {
        ArrowRight: (i + 1) % tabs.length,
        ArrowLeft: (i + tabs.length - 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      }[event.code];
      if (next === undefined) return;
      event.preventDefault();
      selectTab(tabs[next].dataset.tab, true);
    };
  }
  mute.onclick = () => {
    context.audio?.toggleMute();
    render();
  };
  volume.oninput = () => {
    context.audio?.setVolume(Number(volume.value) / 100);
    render();
  };
  function render() {
    companions.render();
    mute.disabled = !context.audio;
    volume.disabled = !context.audio;
    const muted = Boolean(context.audio?.muted);
    mute.querySelector("span").textContent = muted ? "Muted" : "Sound on";
    mute.setAttribute("aria-pressed", String(muted));
    const level = Math.round((context.audio?.volume ?? 0) * 100);
    if (document.activeElement !== volume) volume.value = level;
    root.querySelector("[data-field=volume]").textContent = `${level}%`;
  }
  root.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.code !== "Tab") return;
    const controls = [...root.querySelectorAll("button,select,input")].filter(
      (el) => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length,
    );
    const index = controls.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      controls.at(-1)?.focus();
    } else if (!event.shiftKey && index === controls.length - 1) {
      event.preventDefault();
      controls[0]?.focus();
    }
  });
  for (const type of ["pointerdown", "mousedown", "click", "wheel"])
    root.addEventListener(type, (event) => event.stopPropagation());
  window.addEventListener(
    "keydown",
    (event) => {
      if (
        root.hidden ||
        hudState.hudRuntime.confirm ||
        event.repeat ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey
      )
        return;
      const editable = event.target?.closest?.("input,select,textarea");
      if (event.code === "Escape" || (event.code === "KeyH" && !editable)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
      } else if (!editable && event.shiftKey && ["Delete", "Backspace"].includes(event.code)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showWorldResetConfirmation();
      } else if (!editable && event.code === "KeyM") {
        event.preventDefault();
        event.stopImmediatePropagation();
        mute.click();
      } else if (!editable && ["BracketLeft", "BracketRight"].includes(event.code)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        context.audio?.setVolume(
          (context.audio.volume ?? 0) + (event.code === "BracketRight" ? 0.1 : -0.1),
        );
        render();
      } else if (!root.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.code === "Tab") tabs.find((tab) => tab.tabIndex === 0)?.focus();
      }
    },
    true,
  );
  return {
    root,
    render,
    setOpen(open) {
      if (open === !root.hidden) return;
      root.hidden = !open;
      companions.setVisible?.(open && active === "companion");
      if (open) {
        context.petTown?.panel.close();
        if (document.pointerLockElement) document.exitPointerLock();
        render();
        selectTab(active, true);
      } else if (context.canvas) {
        context.canvas.tabIndex = 0;
        context.canvas.focus({ preventScroll: true });
      }
    },
  };
}
