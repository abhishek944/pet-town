import { drawCreatureMusicIcon } from "./draw-creature-music-icon.js";
/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
import { drawCreatureEmoteHeart } from "./draw-creature-emote-heart.js";
import { drawCreatureEmoteStar } from "./draw-creature-emote-star.js";
export function drawCreatureEmoteIcon(painter, kind, x, y, radius) {
  painter.save();
  painter.lineJoin = `round`;
  painter.lineCap = `round`;
  let gradient = (value5, value6) => {
    let linearGradientResult = painter.createLinearGradient(x, y - radius, x, y + radius);
    linearGradientResult.addColorStop(0, value5);
    linearGradientResult.addColorStop(1, value6);
    return linearGradientResult;
  };
  if (kind === `heart`) {
    drawCreatureEmoteHeart(painter, x, y + radius * 0.08, radius * 1.05);
    painter.fillStyle = gradient(`#ff8fb3`, `#f0386e`);
    painter.fill();
    painter.lineWidth = radius * 0.1;
    painter.strokeStyle = `#c81e55`;
    painter.stroke();
    painter.fillStyle = `rgba(255,255,255,0.85)`;
    painter.beginPath();
    painter.ellipse(
      x - radius * 0.38,
      y - radius * 0.22,
      radius * 0.16,
      radius * 0.1,
      -0.6,
      0,
      Math.PI * 2,
    );
    painter.fill();
  } else if (kind === `note` || kind === `music2`) {
    drawCreatureMusicIcon(painter, kind, x, y, radius, gradient);
  } else if (kind === `exclaim` || kind === `question`) {
    painter.font = `900 ${Math.round(radius * 2.1)}px ui-rounded, "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif`;
    painter.textAlign = `center`;
    painter.textBaseline = `middle`;
    painter.lineWidth = radius * 0.22;
    painter.strokeStyle = kind === `exclaim` ? `#c85a00` : `#2d56c0`;
    painter.fillStyle =
      kind === `exclaim` ? gradient(`#ffd24a`, `#ff8a1e`) : gradient(`#9fd0ff`, `#4a86f0`);
    let result = kind === `exclaim` ? `!` : `?`;
    painter.strokeText(result, x, y + radius * 0.12);
    painter.fillText(result, x, y + radius * 0.12);
  } else {
    if (kind === `sparkle` || kind === `star`) {
      painter.fillStyle = gradient(`#fff6a8`, `#ffc21e`);
      painter.strokeStyle = `#e09a00`;
      painter.lineWidth = radius * 0.08;
      if (kind === `sparkle`) {
        drawCreatureEmoteStar(painter, x - radius * 0.12, y + radius * 0.08, radius * 0.85, 4, 0.3);
        painter.fill();
        painter.stroke();
        drawCreatureEmoteStar(painter, x + radius * 0.62, y - radius * 0.55, radius * 0.36, 4, 0.3);
        painter.fill();
      } else {
        drawCreatureEmoteStar(painter, x, y + radius * 0.05, radius * 0.95, 5, 0.48);
        painter.fill();
        painter.stroke();
      }
    } else {
      if (kind === `sweat`) {
        painter.beginPath();
        painter.moveTo(x, y - radius * 0.85);
        painter.bezierCurveTo(
          x + radius * 0.75,
          y + radius * 0.05,
          x + radius * 0.55,
          y + radius * 0.75,
          x,
          y + radius * 0.75,
        );
        painter.bezierCurveTo(
          x - radius * 0.55,
          y + radius * 0.75,
          x - radius * 0.75,
          y + radius * 0.05,
          x,
          y - radius * 0.85,
        );
        painter.closePath();
        painter.fillStyle = gradient(`#bfe8ff`, `#4aa8f0`);
        painter.fill();
        painter.lineWidth = radius * 0.08;
        painter.strokeStyle = `#2a7ec8`;
        painter.stroke();
        painter.fillStyle = `rgba(255,255,255,0.9)`;
        painter.beginPath();
        painter.ellipse(
          x - radius * 0.2,
          y + radius * 0.25,
          radius * 0.1,
          radius * 0.2,
          0.3,
          0,
          Math.PI * 2,
        );
        painter.fill();
      } else {
        if (kind === `leaf`) {
          painter.beginPath();
          painter.moveTo(x - radius * 0.75, y + radius * 0.7);
          painter.bezierCurveTo(
            x - radius * 0.8,
            y - radius * 0.4,
            x + radius * 0.1,
            y - radius * 0.9,
            x + radius * 0.8,
            y - radius * 0.8,
          );
          painter.bezierCurveTo(
            x + radius * 0.75,
            y + radius * 0.1,
            x,
            y + radius * 0.8,
            x - radius * 0.75,
            y + radius * 0.7,
          );
          painter.closePath();
          painter.fillStyle = gradient(`#a8f07a`, `#3faa3a`);
          painter.fill();
          painter.lineWidth = radius * 0.08;
          painter.strokeStyle = `#2f8a30`;
          painter.stroke();
          painter.beginPath();
          painter.moveTo(x - radius * 0.7, y + radius * 0.65);
          painter.quadraticCurveTo(x, y - radius * 0.05, x + radius * 0.7, y - radius * 0.72);
          painter.lineWidth = radius * 0.08;
          painter.stroke();
        } else {
          if (kind === `zzz`) {
            painter.font = `900 ${Math.round(radius * 1.3)}px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif`;
            painter.textAlign = `center`;
            painter.textBaseline = `middle`;
            painter.lineWidth = radius * 0.16;
            painter.strokeStyle = `#4a4aa8`;
            painter.fillStyle = `#b8b8ff`;
            painter.strokeText(`z`, x - radius * 0.45, y + radius * 0.35);
            painter.fillText(`z`, x - radius * 0.45, y + radius * 0.35);
            painter.font = `900 ${Math.round(radius * 0.95)}px ui-rounded, system-ui, sans-serif`;
            painter.strokeText(`z`, x + radius * 0.35, y - radius * 0.3);
            painter.fillText(`z`, x + radius * 0.35, y - radius * 0.3);
          }
        }
      }
    }
  }
  painter.restore();
}
