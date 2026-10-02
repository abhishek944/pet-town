/** xterm's public documentOverride keeps generated styles within the native CSP. */
export function terminalDocument() {
  const nonce = document.querySelector("style[nonce]")?.nonce;
  if (!nonce) return document;
  return new Proxy(document, {
    get(target, property) {
      if (property === "createElement")
        return (tag, ...args) => {
          const element = target.createElement(tag, ...args);
          if (String(tag).toLowerCase() === "style") element.nonce = nonce;
          return element;
        };
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
