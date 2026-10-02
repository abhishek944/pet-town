/** Input guards, cursor art and desktop/touch building event bindings. */
export let createBuildingCursor = (value, value2) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><circle cx='16' cy='16' r='8.5' fill='none' stroke='${value}' stroke-width='5' opacity='.45'/><circle cx='16' cy='16' r='8.5' fill='none' stroke='${value2}' stroke-width='3'/><circle cx='16' cy='16' r='2.2' fill='${value2}' stroke='${value}' stroke-width='1'/></svg>`)}") 16 16, crosshair`;
