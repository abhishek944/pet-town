/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
export function getCottagePorchLayout(porchValue) {
  let result = 0.5;
  if (porchValue.porch === `veranda`) {
    let result5 = porchValue.W + 0.3;
    let result6 = 1.7;
    let result7 = porchValue.D / 2 + 0.2;
    return {
      F: result,
      cx: 0,
      pw: result5,
      pd: result6,
      pz0: result7,
      stepX: porchValue.doorX ?? 0,
      stepZ: result7 + result6,
    };
  }
  let result2 = 1.6;
  let result3 = porchValue.D / 2 + 0.2;
  let result4 = porchValue.doorX ?? -1;
  return {
    F: result,
    cx: result4,
    pw: 3,
    pd: result2,
    pz0: result3,
    stepX: result4,
    stepZ: result3 + result2,
  };
}
