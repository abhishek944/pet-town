import { behaviorPackForCharacter } from "./character-packs";
import { PET_STATES, type HerdrState } from "./flow-types";
import { previewAnimations, type PreviewAnimationOption } from "./settings-preview";

export function configurePetPreview(
  petId: string,
  onStatePreview: (clip: string, action: "idle" | "walking") => void,
  onEditState: (petId: string, state: HerdrState, file: File) => void,
): PreviewAnimationOption[] {
  const options = previewAnimations(behaviorPackForCharacter(petId));
  renderStateMap(petId, onStatePreview, onEditState, options);
  return options;
}

export function renderStateMap(
  petId: string,
  preview: (clip: string, action: "idle" | "walking") => void,
  edit: (petId: string, state: HerdrState, file: File) => void,
  options: readonly PreviewAnimationOption[] = [],
): void {
  const pack = behaviorPackForCharacter(petId);
  const states: readonly HerdrState[] = PET_STATES;
  const labels: Record<HerdrState, string> = {
    idle: "Idle",
    working: "Running",
    blocked: "Blocked",
    done: "Completed",
    unknown: "Unknown",
    listening: "Listening (mayor)",
  };
  const root = document.getElementById("pet-state-map");
  if (!root) return;
  root.replaceChildren(
    ...states.map((state) => {
      const assignment = pack.stateAssignments[state];
      const assigned = assignment.visible && assignment.animation;
      const row = document.createElement("div");
      row.className = "state-map-row";
      const previewButton = document.createElement("button");
      previewButton.type = "button";
      previewButton.className = "state-preview";
      const name = document.createElement("strong");
      name.textContent = labels[state];
      const action = document.createElement("small");
      action.textContent = `Action: ${assignment.action === "walking" ? "Walking" : "Idle"}`;
      const heading = document.createElement("span");
      heading.className = "state-heading";
      heading.append(name, action);
      previewButton.append(heading);
      if (assigned) {
        const assetUrl = options.find(
          (item) => item.id === `clip:${assignment.animation}`,
        )?.assetUrl;
        if (assetUrl) {
          const thumb = document.createElement("img");
          thumb.className = "state-thumb";
          thumb.src = assetUrl;
          thumb.alt = `${assignment.animation} animation preview`;
          previewButton.append(thumb);
        }
      } else {
        const empty = document.createElement("span");
        empty.className = "state-empty";
        empty.textContent = "No APNG";
        previewButton.append(empty);
      }
      const animation = document.createElement("span");
      animation.textContent = assigned ? `2D: ${assignment.animation}` : "Hidden";
      previewButton.append(animation);
      previewButton.disabled = !assigned;
      previewButton.setAttribute(
        "aria-label",
        assigned
          ? `Preview ${labels[state]}: ${assignment.animation}`
          : `${labels[state]} is hidden`,
      );
      previewButton.addEventListener("click", () => {
        if (assignment.animation) preview(assignment.animation, assignment.action);
      });
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "state-edit";
      editButton.textContent = assigned ? "Replace" : "+ Add";
      editButton.setAttribute(
        "aria-label",
        `${assigned ? "Choose a replacement APNG for" : "Choose an APNG for"} ${labels[state]}`,
      );
      const filePicker = document.createElement("input");
      filePicker.type = "file";
      filePicker.accept = ".apng,.png,image/apng,image/png";
      filePicker.className = "state-file-picker";
      filePicker.tabIndex = -1;
      filePicker.setAttribute("aria-hidden", "true");
      filePicker.addEventListener("change", () => {
        const file = filePicker.files?.[0];
        if (file) edit(petId, state, file);
        filePicker.value = "";
      });
      editButton.addEventListener("click", () => filePicker.click());
      row.append(previewButton, editButton, filePicker);
      return row;
    }),
  );
}
