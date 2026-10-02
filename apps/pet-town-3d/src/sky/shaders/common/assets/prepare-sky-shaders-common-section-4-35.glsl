 * v;
    return max(v, 0.0) * (0.6 / uExposure);
  } else if (uTM == 2) {
    c = clamp(c, 0.0,
