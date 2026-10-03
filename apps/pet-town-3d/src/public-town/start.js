import "./public-town.css";

const canvas = document.getElementById("game");
const boot = document.getElementById("boot");
const retry = document.createElement("button");
retry.type = "button";
retry.textContent = "Retry";
retry.onclick = () => location.reload();
boot.querySelector(".public-boot-links").append(retry);
let failed = false;
for (const type of ["keydown", "keyup"]) {
  window.addEventListener(
    type,
    (event) => {
      if (failed) event.stopImmediatePropagation();
    },
    true,
  );
}
function showFailure(message) {
  if (failed) return;
  failed = true;
  const panel = document.createElement("dialog");
  panel.className = "public-town-error";
  panel.setAttribute("role", "alertdialog");
  panel.setAttribute("aria-labelledby", "public-town-error-title");
  panel.innerHTML =
    '<h1 id="public-town-error-title">The town could not open</h1><p></p>' +
    '<button type="button">Try again</button><a href="../">Back to Pet Town</a>';
  panel.querySelector("p").textContent = message;
  panel.querySelector("button").onclick = () => location.reload();
  document.body.append(panel);
  panel.addEventListener("cancel", (event) => event.preventDefault());
  window.dispatchEvent(new Event("blur"));
  panel.showModal();
  panel.querySelector("button").focus();
}
canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  showFailure(
    "The graphics connection was interrupted. Try reopening the town. Your saved builds stay in this browser.",
  );
});
const timeout = setTimeout(() => {
  const label = boot.querySelector(".town-loading");
  if (boot.isConnected && label)
    label.textContent = "Still loading. You can retry or return to Pet Town.";
}, 20000);
addEventListener("pet-town:playable", () => clearTimeout(timeout), { once: true });
addEventListener(
  "pet-town:ready",
  () => {
    if (!boot.isConnected) clearTimeout(timeout);
  },
  { once: true },
);
import("../main.js").catch((error) => {
  clearTimeout(timeout);
  console.error("Public town could not start:", error);
  showFailure(
    "This game needs a browser with WebGL graphics enabled. Try an updated browser, or return to explore Pet Town.",
  );
});
