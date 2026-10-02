export function playerInputOn(target, eventName, listener, options) {
  target?.addEventListener?.(eventName, listener, options);
}
