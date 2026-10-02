/** HUD context, state, DOM helpers, clock colors and weather display values. */
export let createHudElement = (html) => {
  let element = document.createElement(`template`);
  element.innerHTML = html.trim();
  return element.content.firstElementChild;
};
