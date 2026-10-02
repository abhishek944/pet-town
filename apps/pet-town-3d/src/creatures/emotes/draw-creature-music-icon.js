export function drawCreatureMusicIcon(painter, kind, x, y, radius, gradient) {
  painter.fillStyle = gradient(`#8fb6ff`, `#3f6fe0`);
  painter.strokeStyle = `#2d56c0`;
  painter.lineWidth = radius * 0.08;
  if (kind === `note`) {
    painter.beginPath();
    painter.ellipse(
      x - radius * 0.25,
      y + radius * 0.5,
      radius * 0.34,
      radius * 0.25,
      -0.45,
      0,
      Math.PI * 2,
    );
    painter.fill();
    painter.stroke();
    painter.fillRect(x + radius * 0.02, y - radius * 0.8, radius * 0.16, radius * 1.3);
    painter.beginPath();
    painter.moveTo(x + radius * 0.1, y - radius * 0.8);
    painter.quadraticCurveTo(
      x + radius * 0.7,
      y - radius * 0.55,
      x + radius * 0.55,
      y - radius * 0.05,
    );
    painter.lineWidth = radius * 0.18;
    painter.strokeStyle = `#3f6fe0`;
    painter.stroke();
  } else {
    painter.beginPath();
    painter.ellipse(
      x - radius * 0.5,
      y + radius * 0.5,
      radius * 0.28,
      radius * 0.2,
      -0.45,
      0,
      Math.PI * 2,
    );
    painter.fill();
    painter.beginPath();
    painter.ellipse(
      x + radius * 0.4,
      y + radius * 0.35,
      radius * 0.28,
      radius * 0.2,
      -0.45,
      0,
      Math.PI * 2,
    );
    painter.fill();
    painter.fillRect(x - radius * 0.32, y - radius * 0.6, radius * 0.13, radius * 1.1);
    painter.fillRect(x + radius * 0.58, y - radius * 0.75, radius * 0.13, radius * 1.1);
    painter.beginPath();
    painter.moveTo(x - radius * 0.32, y - radius * 0.6);
    painter.lineTo(x + radius * 0.71, y - radius * 0.75);
    painter.lineTo(x + radius * 0.71, y - radius * 0.45);
    painter.lineTo(x - radius * 0.32, y - radius * 0.3);
    painter.closePath();
    painter.fill();
  }
}
