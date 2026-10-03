import { bindWorldFocus } from "./world-focus.js";

export function bindDockListeners(view, callbacks, signal) {
  const {
    clearFocus,
    clearInput,
    setFocus,
    canInput,
    focusTerminal,
    attach,
    close,
    external,
    release,
    back,
    controller,
  } = callbacks;
  const listen = (element, event, callback) =>
    element.addEventListener(event, callback, { signal });
  bindWorldFocus(view.root, clearFocus, signal);
  for (const type of [
    "pointerdown",
    "pointerup",
    "mousedown",
    "mouseup",
    "click",
    "dblclick",
    "wheel",
    "keydown",
    "keyup",
    "contextmenu",
  ])
    listen(view.root, type, (event) => event.stopPropagation());
  listen(view.root, "focusin", () => {
    setFocus(true);
    clearInput();
  });
  listen(view.root, "focusout", (event) => {
    if (!view.root.contains(event.relatedTarget)) {
      setFocus(false);
      clearInput();
    }
  });
  listen(view.fields.viewport, "pointerdown", () => {
    clearInput();
    if (canInput()) {
      setFocus(true);
      focusTerminal();
    }
  });
  listen(view.controls.close, "click", close);
  listen(view.controls.back, "click", back);
  listen(view.profile.controls.open, "click", external);
  listen(view.profile.controls.observe, "click", () => attach(false));
  listen(view.profile.controls.interact, "click", () => attach(true));
  listen(view.profile.controls.control, "click", () => controller.toggleControl());
  listen(view.profile.controls.camera, "click", () => controller.toggleView());
  listen(view.profile.controls.leave, "click", () => controller.select(null));
  listen(view.controls.watch, "click", () => attach(false));
  listen(view.controls.interact, "click", () => attach(true));
  listen(view.controls.takeover, "click", () => attach(true, true));
  listen(view.controls.retry, "click", () => attach());
  listen(view.controls.open, "click", external);
  listen(view.controls.external, "click", external);
  listen(window, "blur", release);
  listen(document, "visibilitychange", () => {
    if (document.hidden) release();
  });
}
