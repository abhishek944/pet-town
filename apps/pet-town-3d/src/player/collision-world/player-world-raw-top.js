export function playerWorldRawTop(x, z) {
  let t2 = this.t;
  if (!t2) {
    return null;
  }
  let result;
  try {
    if (typeof t2.topY == `function`) {
      result = t2.topY(x, z);
    }
    if ((result == null || !isFinite(result)) && typeof t2.heightAt == `function`) {
      result = t2.heightAt(x, z);
    }
  } catch {
    return null;
  }
  return result == null || !isFinite(result) ? null : result;
}
