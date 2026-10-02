import { Vector3 } from "three";
import { liveMayorStatus } from "./live-status.js";

/** Present the native Mayor's speech near its actor, including first-person views. */
export function createMayorSpeech() {
  const root = document.createElement("aside");
  root.className = "pt-mayor-speech";
  root.hidden = true;
  root.setAttribute("aria-label", "Mayor speech");
  const name = document.createElement("strong");
  const text = document.createElement("p");
  root.append(name, text);
  document.body.append(root);
  const point = new Vector3();
  const direction = new Vector3();
  let previousSpeech = "";
  let remaining = 0;
  let occluded = false;
  let visibilityTimer = 0;

  return {
    update(deltaTime, context, record, mayor, uiHidden) {
      const speech = mayor?.speech || "";
      if (speech !== previousSpeech) {
        previousSpeech = speech;
        remaining = speech ? 12 : 0;
      }
      remaining = mayor?.speaking ? 8 : Math.max(0, remaining - deltaTime);
      const live = mayor?.firstmateMode === false ? liveMayorStatus(mayor) : null;
      const voiceBusy = mayor?.listening || mayor?.working || mayor?.speaking;
      const visibleSpeech =
        speech && !mayor?.listening && !mayor?.working && (mayor?.speaking || remaining > 0);
      root.hidden = Boolean(
        uiHidden ||
        !record ||
        !mayor?.active ||
        (!voiceBusy && !visibleSpeech && !live?.connecting && !live?.error),
      );
      if (root.hidden) return;
      name.textContent = mayor.name || "Mayor";
      const message =
        live?.error || live?.connecting
          ? live.message
          : visibleSpeech
            ? speech
            : live?.message ||
              mayor.voiceStatus ||
              (mayor.listening ? "Listening…" : "Firstmate is working…");
      text.textContent = message.length > 340 ? `${message.slice(0, 337)}…` : message;
      const firstPerson = Boolean(context.petTown?.controller.firstPerson);
      root.dataset.fixed = String(firstPerson);
      if (firstPerson) {
        root.style.transform = "";
        return;
      }
      point.copy(record.head);
      point.y += 1.05;
      visibilityTimer -= deltaTime;
      if (visibilityTimer <= 0) {
        visibilityTimer = 0.18;
        direction.copy(point).sub(context.camera.position);
        const distance = direction.length();
        direction.normalize();
        const hit = context.terrain?.raycast(context.camera.position, direction, distance);
        occluded = Boolean(hit && hit.distance < distance - 0.4);
      }
      point.project(context.camera);
      root.hidden =
        !record.root.visible ||
        occluded ||
        Math.abs(point.z) > 1 ||
        Math.abs(point.x) > 1 ||
        Math.abs(point.y) > 1;
      if (!root.hidden) {
        root.style.transform = `translate(${((point.x + 1) * (context.viewport?.width ?? innerWidth)) / 2}px,${((1 - point.y) * (context.viewport?.height ?? innerHeight)) / 2}px) translate(-50%,-100%)`;
      }
    },
    dispose() {
      root.remove();
    },
  };
}
