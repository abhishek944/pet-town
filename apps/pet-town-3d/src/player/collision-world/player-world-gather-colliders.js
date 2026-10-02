export function playerWorldGatherColliders(x, y, z, radius = 5) {
  let colliders2 = this.colliders;
  colliders2.length = 0;
  this._gatherCamOccluders(x, z, radius);
  let ctx2 = this.ctx;
  let vegetation2 = ctx2.vegetation;
  let values2 = [
    [ctx2.props?.colliders, false],
    [vegetation2?.colliders, true],
    [vegetation2?.colliders ? null : vegetation2?.trees, true],
    [ctx2.colliders, false],
    [ctx2.world?.colliders, false],
  ];
  for (let [result, result2] of values2) {
    if (!result) {
      continue;
    }
    let resultValue = result;
    if (!Array.isArray(resultValue)) {
      try {
        resultValue = Array.from(result.values ? result.values() : result);
      } catch {
        continue;
      }
    }
    let result3 = !result2 && result === ctx2.props?.colliders;
    for (let index = 0; index < resultValue.length; index++) {
      let position = resultValue[index];
      if (
        result3 &&
        position &&
        !position.x1 &&
        position.radius > 0 &&
        position.radius < 0.35 &&
        !(position.w > 0)
      ) {
        let position2 = resultValue[index + 1];
        let result4 = resultValue[index - 1];
        let callback = (position3) =>
          position3 &&
          !position3.x1 &&
          !(position3.w > 0) &&
          Math.abs((position3.radius ?? 0) - position.radius) < 0.001 &&
          Math.hypot(position3.x - position.x, position3.z - position.z) < 0.85 &&
          Math.abs((position3.y0 ?? 0) - (position.y0 ?? 0)) < 0.8;
        if (callback(position2)) {
          if (Math.abs(position.x - x) < radius && Math.abs(position.z - z) < radius) {
            let _parseResult2 = this._parse(
              {
                x1: position.x,
                z1: position.z,
                x2: position2.x,
                z2: position2.z,
                r: position.radius,
                y0: Math.min(position.y0 ?? position.y ?? NaN, position2.y0 ?? position2.y ?? NaN),
                h: Math.max(position.h ?? 1.2, position2.h ?? 1.2),
                noTop: true,
              },
              false,
              x,
              z,
              radius,
            );
            if (_parseResult2) {
              colliders2.push(_parseResult2);
            }
          }
          continue;
        }
        if (callback(result4)) {
          continue;
        }
      }
      let _parseResult = this._parse(position, result2, x, z, radius);
      if (_parseResult) {
        colliders2.push(_parseResult);
      }
    }
  }
  let trees2 = vegetation2?.trees;
  if (Array.isArray(trees2)) {
    for (let position4 of trees2) {
      if (
        !position4 ||
        !/pine/i.test(String(position4.type ?? ``)) ||
        Math.abs(position4.x - x) > radius ||
        Math.abs(position4.z - z) > radius ||
        colliders2.some(
          (position5) =>
            position5.kind === `cyl` &&
            position5.r >= 0.6 &&
            Math.abs(position5.x - position4.x) < 0.05 &&
            Math.abs(position5.z - position4.z) < 0.05,
        )
      ) {
        continue;
      }
      let result5 = Number.isFinite(position4.y)
        ? position4.y
        : this.groundBelow(position4.x, 60, position4.z);
      colliders2.push({
        kind: `cyl`,
        x: position4.x,
        z: position4.z,
        r: Math.min(0.9, (position4.canopyRadius ?? 2.4) * 0.36),
        y0: result5 + 0.95,
        y1: result5 + 2.8,
        noTop: true,
      });
    }
  }
  return colliders2;
}
