export function getPlayerInputDragging() {
  return !!this.drag && (this.drag.button !== 0 || this.drag.moved > 4);
}
