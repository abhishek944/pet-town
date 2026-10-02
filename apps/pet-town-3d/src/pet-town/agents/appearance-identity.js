import { Color } from "three";

const COLORS = [
  "Rose",
  "Coral",
  "Amber",
  "Lime",
  "Mint",
  "Jade",
  "Teal",
  "Blue",
  "Indigo",
  "Violet",
  "Plum",
  "Pink",
];
const ACCESSORIES = ["round glasses", "a feather", "a bow", "a flower", "a little cap"];

/** One stable identity drives the model materials, accessory and UI portrait. */
export function agentAppearance(seed, isMayor) {
  const hue = isMayor ? 0.12 : (seed % 65521) / 65521;
  const accentHue = (hue + 0.37 + ((seed >>> 16) % 9) * 0.012) % 1;
  const variant = (seed >>> 8) % ACCESSORIES.length;
  return {
    hue,
    accentHue,
    variant,
    coat: `#${new Color().setHSL(hue, 0.48, 0.42).getHexString()}`,
    accent: `#${new Color().setHSL(accentHue, 0.58, 0.54).getHexString()}`,
    label: isMayor
      ? "Golden Mayor with a crown"
      : `${COLORS[Math.floor(hue * 12)]} explorer with ${ACCESSORIES[variant]}`,
  };
}
