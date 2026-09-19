import { Actor, Color, Engine, Font, FontUnit, Label, vec } from "excalibur";
import { CAPABILITIES, type ActionIntent, type AgentView } from "@pet-town/core";
import { PETS } from "./pets";

const TEXT = Color.fromHex("#f2f1f7");
const VIOLET = Color.fromHex("#8172eb");

export function renderActionPalette(
  engine: Engine,
  agent: AgentView,
  left: number,
  top: number,
  width: number,
  actors: Actor[],
  selectedIndex: number,
  submit: (intent: ActionIntent) => void,
): string {
  const add = (actor: Actor): void => {
    actors.push(actor);
    engine.add(actor);
  };
  const label = (
    text: string,
    x: number,
    y: number,
    size: number,
    color: Color,
    bold = false,
  ): Label =>
    new Label({
      text,
      pos: vec(x, y),
      color,
      z: 32,
      font: new Font({ size, unit: FontUnit.Px, family: "sans-serif", bold }),
    });
  const capabilities = PETS[agent.petId]?.capabilities ?? [];
  add(label(`${agent.name} actions`, left + 20, top + 28, 16, TEXT, true));
  const columns = Math.min(4, capabilities.length);
  capabilities.forEach((capability, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cellWidth = (width - 40) / columns;
    const x = left + 20 + column * cellWidth;
    const y = top + 62 + row * 48;
    const option = new Actor({
      pos: vec(x + cellWidth / 2 - 2, y),
      width: cellWidth - 4,
      height: 40,
      color: index === selectedIndex ? VIOLET : Color.fromHex("#292d37"),
      z: 31,
    });
    option.on("pointerup", () => submit({ actorId: agent.id, capability }));
    add(option);
    add(label(`${index + 1}  ${CAPABILITIES[capability].label}`, x + 10, y - 6, 11, TEXT, true));
  });
  add(
    label("Choose an action or press its number    Esc Cancel", left + 20, top + 158, 10, VIOLET),
  );
  return `${agent.name} actions: ${capabilities.map((id) => CAPABILITIES[id].label).join(", ")}`;
}
