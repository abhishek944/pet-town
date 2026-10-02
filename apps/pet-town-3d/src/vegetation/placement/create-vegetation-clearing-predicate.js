/** Vegetation clearings, flower palettes and biome-aware world population. */
export function createVegetationClearingPredicate(value) {
  return (value2, value3, value4, radiusValue) => {
    for (let position of value) {
      if (position.box) {
        let [box2, box3, box4, box5, box6] = position.box;
        let result =
          box6 + (value4 === `tree` ? (radiusValue ? radiusValue.radius + 0.6 : 1) : 0.1);
        if (
          (value4 === `tree` ? position.trees : position.small) !== false &&
          value2 >= box2 - result &&
          value2 <= box4 + result &&
          value3 >= box3 - result &&
          value3 <= box5 + result
        ) {
          return true;
        }
        continue;
      }
      let hypotResult = Math.hypot(value2 - position.x, value3 - position.z);
      if (value4 === `tree`) {
        if (
          position.tr > 0 &&
          hypotResult <=
            position.tr +
              (radiusValue
                ? Math.max(radiusValue.radius, radiusValue.canopyRadius * (position.canopy ?? 0.55))
                : 1)
        ) {
          return true;
        }
      } else if (position.sr > 0 && hypotResult <= position.sr) {
        return true;
      }
    }
    return false;
  };
}
