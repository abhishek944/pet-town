import { Color, Engine, Font, FontUnit, Label, vec } from "excalibur";

export function drawPlayroomHeader(engine: Engine): void {
  engine.add(
    new Label({
      text: "Pet Town Playroom",
      pos: vec(28, 38),
      color: Color.White,
      z: -1,
      font: new Font({ size: 18, unit: FontUnit.Px, family: "sans-serif", bold: true }),
    }),
  );
  engine.add(
    new Label({
      text: "Press / to ask the village to act",
      pos: vec(28, 62),
      color: Color.fromHex("#a4a7b1"),
      z: -1,
      font: new Font({ size: 11, unit: FontUnit.Px, family: "sans-serif" }),
    }),
  );
}
