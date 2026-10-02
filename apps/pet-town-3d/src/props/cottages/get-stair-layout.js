/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
export function getStairLayout(value, value2) {
  let result = Math.max(0.2, value - value2);
  let result2 = Math.max(1, Math.round(result / 0.27) - 1);
  return {
    n: result2,
    rise: result / (result2 + 1),
    depth: 0.4,
    F: value,
    g: value2,
  };
}
