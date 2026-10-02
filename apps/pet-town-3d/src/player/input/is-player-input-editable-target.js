/** Keyboard, mouse, touch, gamepad and pointer-lock input. */
export let isPlayerInputEditableTarget = (targetValue) => {
  let target2 = targetValue.target;
  return (
    target2 && (target2.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target2.tagName))
  );
};
