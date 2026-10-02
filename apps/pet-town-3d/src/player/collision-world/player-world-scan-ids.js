export function playerWorldScanIds() {
  this.waterIds = new Set([`water`]);
  let callback = (isObject3DValue, value = 0) => {
    if (
      !isObject3DValue ||
      typeof isObject3DValue != `object` ||
      isObject3DValue.isObject3D ||
      ArrayBuffer.isView(isObject3DValue) ||
      value > 1
    ) {
      return;
    }
    let values;
    try {
      values = Object.keys(isObject3DValue);
    } catch {
      return;
    }
    if (!(values.length > 400)) {
      for (let result of values) {
        let values2;
        try {
          values2 = isObject3DValue[result];
        } catch {
          continue;
        }
        if (/water/i.test(result)) {
          if (typeof values2 == `number` || typeof values2 == `string`) {
            this.waterIds.add(values2);
          } else {
            if (values2 && typeof values2 == `object` && `id` in values2) {
              this.waterIds.add(values2.id);
            }
          }
        }
        if (values2 && typeof values2 == `object` && !Array.isArray(values2)) {
          callback(values2, value + 1);
        }
        if (Array.isArray(values2) && values2.length < 256) {
          values2.forEach((nameValue, value2) => {
            if (
              nameValue &&
              typeof nameValue == `object` &&
              /water/i.test(String(nameValue.name ?? nameValue.type ?? ``))
            ) {
              this.waterIds.add(nameValue.id ?? value2);
            }
          });
        }
      }
    }
  };
  try {
    callback(this.t);
  } catch {}
}
