const DRAG_THRESHOLD_PX = 4;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const WAVE_ICON_PATHS = ["M7.5 20.5v-6.2l-1.9-1.7c-.7-.7-.8-1.7-.2-2.4.6-.6 1.5-.6 2.1 0l1 1V6.6a1.4 1.4 0 0 1 2.8 0v4.1l.1-6a1.4 1.4 0 0 1 2.8 0V11l.1-4.2a1.4 1.4 0 0 1 2.8 0v6c0 4.2-2.6 7.7-6.3 7.7-1.1 0-2.1-.3-3.1-.9"];
const PREFERENCES_ICON_PATHS = ["M4 7h9", "M17 7h3", "M4 17h3", "M11 17h9", "M13 4v6", "M8 14v6", "M17 7a2 2 0 1 1-4 0 2 2 0 1 1 4 0", "M11 17a2 2 0 1 1-4 0 2 2 0 1 1 4 0"];
const ACTION_ICON_PATHS = ["M12 4l1.6 4.1L17.7 9.7l-4.1 1.6L12 15.4l-1.6-4.1L6.3 9.7l4.1-1.6z", "M18.5 15.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"];
function menuIcon(paths: readonly string[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  for (const d of paths) {
    const path = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg as unknown as SVGSVGElement;
}
function iconForAction(id: string): readonly string[] {
  return id === "wave" ? WAVE_ICON_PATHS : ACTION_ICON_PATHS;
}
export interface PetActionItem {
  id: string;
  label: string;
}
export interface PetInteractionDelegate {
  actionsFor(id: string): PetActionItem[];
  startAction(id: string, actionId: string): boolean;
  openPreferences(id: string): void;
  beginDrag(id: string, clientX: number): boolean;
  moveDrag(id: string, clientX: number): void;
  endDrag(id: string): void;
  geometryChanged(): void;
}
function petTarget(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(".pet") : null;
}
function agentId(target: EventTarget | null): string | null {
  return target instanceof Element ? target.closest<HTMLElement>(".citizen")?.dataset.agentId ?? null : null;
}
export function installPetInteractions(
  root: HTMLElement,
  delegate: PetInteractionDelegate,
): () => void {
  let pointerId: number | null = null;
  let draggedId: string | null = null;
  let startX = 0;
  let dragging = false;
  let suppressClick = false;
  let menu: HTMLElement | null = null;
  let menuBackdrop: HTMLElement | null = null;
  let menuAgentId: string | null = null;
  const suppressNextClick = (): void => {
    suppressClick = true;
    globalThis.setTimeout(() => { suppressClick = false; }, 0);
  };

  const closeMenu = (): void => {
    if (!menu) return;
    menu.remove();
    menuBackdrop?.remove();
    menu = null;
    menuBackdrop = null;
    menuAgentId = null;
    delegate.geometryChanged();
  };
  const openMenu = (id: string, x: number, y: number): void => {
    closeMenu();
    menuAgentId = id;
    const actions = delegate.actionsFor(id);
    menuBackdrop = document.createElement("div");
    menuBackdrop.className = "pet-menu-backdrop";
    root.append(menuBackdrop);
    menu = document.createElement("nav");
    menu.className = "pet-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Pet actions");
    for (const action of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      const label = document.createElement("span");
      label.textContent = action.label;
      button.append(menuIcon(iconForAction(action.id)), label);
      button.addEventListener("click", () => {
        delegate.startAction(id, action.id);
        closeMenu();
      });
      menu.append(button);
    }
    if (actions.length > 0) {
      const separator = document.createElement("hr");
      separator.className = "pet-menu-separator";
      menu.append(separator);
    }
    const preferences = document.createElement("button");
    preferences.type = "button";
    preferences.setAttribute("role", "menuitem");
    const preferencesLabel = document.createElement("span");
    preferencesLabel.textContent = "Preferences…";
    preferences.append(menuIcon(PREFERENCES_ICON_PATHS), preferencesLabel);
    preferences.addEventListener("click", () => {
      delegate.openPreferences(id);
      closeMenu();
    });
    menu.append(preferences);
    root.append(menu);
    const left = Math.max(4, Math.min(window.innerWidth - menu.offsetWidth - 4, x));
    const top = Math.max(4, Math.min(window.innerHeight - menu.offsetHeight - 4, y));
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    delegate.geometryChanged();
  };
  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    if (menu && !(event.target instanceof Node && menu.contains(event.target))) closeMenu();
    const id = agentId(event.target);
    const pet = petTarget(event.target);
    if (!id || !pet) return;
    pointerId = event.pointerId;
    draggedId = id;
    startX = event.clientX;
    dragging = false;
    pet.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId || !draggedId) return;
    if (!dragging && Math.abs(event.clientX - startX) >= DRAG_THRESHOLD_PX) {
      dragging = delegate.beginDrag(draggedId, event.clientX);
    }
    if (dragging) {
      event.preventDefault();
      delegate.moveDrag(draggedId, event.clientX);
    }
  };
  const finishDrag = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) return;
    if (dragging && draggedId) {
      delegate.endDrag(draggedId);
      suppressNextClick();
      event.preventDefault();
    }
    pointerId = null;
    draggedId = null;
    dragging = false;
  };
  const onClick = (event: MouseEvent): void => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const onContextMenu = (event: MouseEvent): void => {
    const id = agentId(event.target);
    if (!id) return;
    event.preventDefault();
    openMenu(id, event.clientX, event.clientY);
  };
  const onCitizenHidden = (event: Event): void => {
    const id = (event.target as HTMLElement).dataset.agentId;
    if (id === menuAgentId) closeMenu();
    if (id === draggedId && dragging) { delegate.endDrag(id); suppressNextClick(); }
    if (id === draggedId) { pointerId = null; draggedId = null; dragging = false; }
  };
  const cancelActive = (): void => {
    closeMenu();
    if (draggedId && dragging) { delegate.endDrag(draggedId); suppressNextClick(); }
    pointerId = null; draggedId = null; dragging = false;
  };
  root.addEventListener("village-pause", cancelActive);
  root.addEventListener("citizen-hidden", onCitizenHidden);
  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", finishDrag);
  root.addEventListener("pointercancel", finishDrag);
  root.addEventListener("click", onClick, true);
  root.addEventListener("contextmenu", onContextMenu);
  return () => {
    cancelActive();
    root.removeEventListener("village-pause", cancelActive);
    root.removeEventListener("citizen-hidden", onCitizenHidden);
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerup", finishDrag);
    root.removeEventListener("pointercancel", finishDrag);
    root.removeEventListener("click", onClick, true);
    root.removeEventListener("contextmenu", onContextMenu);
  };
}
