/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
export let getWaterInteractorPosition = (positionValue) =>
  positionValue?.position?.isVector3
    ? positionValue.position
    : (positionValue?.mesh?.position ??
      positionValue?.group?.position ??
      positionValue?.object?.position ??
      positionValue?.root?.position ??
      null);
