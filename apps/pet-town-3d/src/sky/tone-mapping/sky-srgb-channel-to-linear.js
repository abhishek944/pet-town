/** CPU inverse tone mapping and display-to-scene color conversion. */
export let skySrgbChannelToLinear = (value) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
