);
    float np = max(c.r, max(c.g, c.b));
    if (np > 0.76) { float peak = 0.0576 / (1.0 - np) - 0.24 + 0.76; c *= peak / np; }
    float xm = min(c.r, min(c.g, c.b));
    float x = xm >= 0.04 ? xm + 0.04 : sqrt(max(xm, 0.0) / 6.25);
    return (c + (x - xm)) / uExposure;
  } else if (uTM == 3) {
    return c / uExposure;
  }
  return c;
}
