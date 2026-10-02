import "./public-town.css";
import { hudState } from "../hud/state.js";

function createPublicTown() {
  let root;
  let undo;
  let redo;
  let leaving = false;
  return {
    id: "public-town",
    init(context) {
      document.body.classList.add("public-town");
      root = document.createElement("nav");
      root.className = "public-town-tools";
      root.setAttribute("aria-label", "Town navigation and editing");
      root.innerHTML =
        '<a href="../" aria-label="Back to Pet Town">← Pet Town</a>' +
        '<button type="button" data-action="undo" aria-label="Undo last edit">Undo</button>' +
        '<button type="button" data-action="redo" aria-label="Redo last edit">Redo</button>';
      undo = root.querySelector('[data-action="undo"]');
      redo = root.querySelector('[data-action="redo"]');
      undo.onclick = () => context.building.undo();
      redo.onclick = () => context.building.redo();
      root.querySelector("a").onclick = async (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (leaving) return;
        leaving = true;
        const saved = await context.building.saveNow();
        if (
          saved === "none" &&
          !window.confirm("Your latest changes could not be saved. Leave anyway?")
        ) {
          leaving = false;
          return;
        }
        location.assign(root.querySelector("a").href);
      };
      for (const type of ["pointerdown", "click", "wheel"]) {
        root.addEventListener(type, (event) => event.stopPropagation());
      }
      root.addEventListener("keydown", (event) => {
        if (event.code === "Space" || event.code === "Enter") event.stopPropagation();
      });
      document.body.append(root);
    },
    update(_, context) {
      const state = hudState.hudRuntime;
      root.hidden = state.hidden || state.photoMode;
      root.inert = state.help || state.confirm;
      root.dataset.welcome = String(state.splash);
      undo.hidden = redo.hidden = state.splash;
      undo.disabled = !context.building.undoCount;
      redo.disabled = !context.building.redoCount;
    },
    dispose() {
      root?.remove();
      document.body.classList.remove("public-town");
    },
  };
}

export const gameExtensions = [createPublicTown()];
