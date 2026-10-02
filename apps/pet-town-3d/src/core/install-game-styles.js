/** Reuse the packaged page's allowed style nonce for runtime-created game styles. */
export function installGameStyles(id, css) {
  const existing = document.getElementById(id);
  if (existing) return existing;

  const style = document.createElement("style");
  // Tauri assigns nonces to static styles. Read the property: browsers conceal
  // nonce attribute values from getAttribute(). Vite/browser pages need none.
  const nonce = document.querySelector("style[nonce]")?.nonce;
  if (nonce) style.nonce = nonce;
  style.id = id;
  style.textContent = css;
  document.head.append(style);
  return style;
}
