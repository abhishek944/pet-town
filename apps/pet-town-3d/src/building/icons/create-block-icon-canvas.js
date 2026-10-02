/** Block face provider, face cache and isometric hotbar icon generation. */
import { createBlockFaceCanvas } from "./create-block-face-canvas.js";
import { buildingState } from "../state.js";
export function createBlockIconCanvas(key, size = 128) {
  let element = document.createElement(`canvas`);
  element.width = element.height = size;
  let painter = element.getContext(`2d`);
  let blockFaceCanvasResult = createBlockFaceCanvas(key, `top`, 64);
  let blockFaceCanvasResult2 = createBlockFaceCanvas(key, `side`, 64);
  let result = size * 0.375;
  let result2 = result * Math.cos(Math.PI / 6);
  let result3 = result * 0.5;
  let resultValue = result;
  let result4 = size / 2;
  let result5 = size * 0.5 - (2 * result3 + resultValue) / 2 - size * 0.02;
  let values = [result4, result5];
  let values2 = [result4 + result2, result5 + result3];
  let values3 = [result4, result5 + 2 * result3];
  let values4 = [result4 - result2, result5 + result3];
  let result6 = buildingState.buildingPaletteByKey[key] ?? {};
  if (
    (painter.save(),
    (painter.fillStyle = `rgba(90,60,30,.18)`),
    painter.beginPath(),
    painter.ellipse(
      result4,
      values3[1] + resultValue + size * 0.035,
      result2 * 0.95,
      result3 * 0.42,
      0,
      0,
      7,
    ),
    painter.fill(),
    painter.restore(),
    result6.emissive)
  ) {
    let radialGradientResult = painter.createRadialGradient(
      result4,
      result4,
      0,
      result4,
      result4,
      size * 0.5,
    );
    radialGradientResult.addColorStop(0, `rgba(255,220,120,.55)`);
    radialGradientResult.addColorStop(1, `rgba(255,220,120,0)`);
    painter.fillStyle = radialGradientResult;
    painter.fillRect(0, 0, size, size);
  }
  let callback = () => {
    painter.beginPath();
    painter.moveTo(...values);
    painter.lineTo(...values2);
    painter.lineTo(values2[0], values2[1] + resultValue);
    painter.lineTo(values3[0], values3[1] + resultValue);
    painter.lineTo(values4[0], values4[1] + resultValue);
    painter.lineTo(...values4);
    painter.closePath();
  };
  let callback2 = (value3, value4, value5, value6, value7) => {
    painter.save();
    painter.beginPath();
    painter.moveTo(...value4);
    painter.lineTo(value4[0] + value5[0], value4[1] + value5[1]);
    painter.lineTo(value4[0] + value5[0] + value6[0], value4[1] + value5[1] + value6[1]);
    painter.lineTo(value4[0] + value6[0], value4[1] + value6[1]);
    painter.closePath();
    painter.clip();
    painter.setTransform(
      value5[0] / 64,
      value5[1] / 64,
      value6[0] / 64,
      value6[1] / 64,
      value4[0],
      value4[1],
    );
    painter.drawImage(value3, 0, 0);
    painter.setTransform(1, 0, 0, 1, 0, 0);
    if (value7 > 0) {
      painter.fillStyle = `rgba(60,30,20,${value7})`;
      painter.fillRect(0, 0, size, size);
    } else {
      if (value7 < 0) {
        painter.fillStyle = `rgba(255,250,235,${-value7})`;
        painter.fillRect(0, 0, size, size);
      }
    }
    painter.restore();
  };
  painter.globalAlpha = result6.transparent ? 0.85 : 1;
  callback2(
    blockFaceCanvasResult2,
    values4,
    [result2, result3],
    [0, resultValue],
    result6.emissive ? 0.02 : 0.1,
  );
  callback2(
    blockFaceCanvasResult2,
    values3,
    [result2, -result3],
    [0, resultValue],
    result6.emissive ? 0.08 : 0.24,
  );
  callback2(blockFaceCanvasResult, values4, [result2, -result3], [result2, result3], -0.1);
  painter.globalAlpha = 1;
  painter.lineJoin = painter.lineCap = `round`;
  painter.strokeStyle = `rgba(255,255,255,.55)`;
  painter.lineWidth = size * 0.018;
  painter.beginPath();
  painter.moveTo(values4[0] + 2, values4[1]);
  painter.lineTo(values3[0], values3[1] - 1);
  painter.lineTo(values2[0] - 2, values2[1]);
  painter.stroke();
  painter.beginPath();
  painter.moveTo(values3[0], values3[1] + 1);
  painter.lineTo(values3[0], values3[1] + resultValue - 2);
  painter.strokeStyle = `rgba(255,255,255,.25)`;
  painter.stroke();
  callback();
  painter.strokeStyle = `rgba(92,64,44,.55)`;
  painter.lineWidth = size * 0.028;
  painter.stroke();
  return element;
}
