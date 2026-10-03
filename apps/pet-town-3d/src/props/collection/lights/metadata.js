const circle = (x, z, radius, y0, h) => ({ x, z, radius, y0, h, noTop: true });

export function collectionLightMetadata(assetId) {
  switch (assetId) {
    case "twin-lantern":
      return { radius: 1.15, colliders: [circle(0, 0, 0.33, 0, 3.16)] };
    case "flower-lantern":
      return { radius: 1.05, colliders: [circle(0, 0, 0.33, 0, 3.32)] };
    case "celestial-globe":
      return celestialMetadata();
    case "mushroom-lantern":
      return {
        radius: 0.65,
        colliders: [circle(0, 0, 0.28, 0, 0.86), circle(0, 0, 0.65, 0.86, 0.4)],
      };
    case "lily-bell-lamp":
      return {
        radius: 1.2,
        colliders: [
          circle(0, 0, 0.33, 0, 0.45),
          circle(-0.12, 0, 0.15, 0.3, 2.3),
          circle(0.71, 0, 0.44, 2.28, 0.62),
          circle(-0.24, 0.22, 0.21, 0, 0.55),
        ],
      };
    default:
      throw new Error(`Unknown collection light: ${assetId}`);
  }
}

function celestialMetadata() {
  const colliders = [
    { x: 0, z: 0, w: 1.55, d: 0.7, radius: 0.85, h: 0.56, noTop: true },
    circle(0, 0, 0.38, 1.32, 0.76),
  ];
  // Small elevated cylinders follow the actual ring; the arch's open center stays open.
  for (let index = 0; index < 32; index++) {
    const angle = (index * Math.PI * 2) / 32;
    colliders.push(circle(Math.cos(angle), 0, 0.125, 1.5 + Math.sin(angle) - 0.1, 0.2));
  }
  return { radius: 1.075, colliders };
}
