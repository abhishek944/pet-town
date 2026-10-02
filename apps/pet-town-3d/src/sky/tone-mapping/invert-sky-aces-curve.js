/** CPU inverse tone mapping and display-to-scene color conversion. */
export let invertSkyAcesCurve = (value) => {
  let result = 1 - 0.983729 * value;
  let result2 = 0.0245786 - 0.432951 * value;
  let result3 = -(90537e-9 + 0.238081 * value);
  return (
    (-result2 + Math.sqrt(Math.max(result2 * result2 - 4 * result * result3, 0))) / (2 * result)
  );
};
