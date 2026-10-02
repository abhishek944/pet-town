;
  if (bs > 0.0) {
    float hx = sampleLayer(vTUv + gDX, vTile).a - hgt;
    float hy = sampleLayer(vTUv + gDY, vTile).a - hgt;
    normal = terrainPerturb(normal, vec2(hx, hy) * bs * 0.9, faceDirection);
  }
}
