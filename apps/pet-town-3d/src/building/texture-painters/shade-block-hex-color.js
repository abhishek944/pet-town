/** Seeded procedural canvas painting helpers and block-face art. */
export function shadeBlockHexColor(hexColor, amount) {
  let parseIntResult = parseInt(hexColor.slice(1), 16);
  let result = parseIntResult >> 16;
  let result2 = (parseIntResult >> 8) & 255;
  let result3 = parseIntResult & 255;
  if (amount >= 0) {
    result += (255 - result) * amount;
    result2 += (255 - result2) * amount;
    result3 += (255 - result3) * amount;
  } else {
    result *= 1 + amount;
    result2 *= 1 + amount;
    result3 *= 1 + amount;
  }
  return `rgb(${result | 0},${result2 | 0},${result3 | 0})`;
}
