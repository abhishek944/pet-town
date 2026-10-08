// Minimal DOM stand-in for the preference fixtures, which run the renderer in Node with no browser.
// Nodes are plain objects, so the DOM classes exist only to keep `instanceof` checks falsy instead of
// throwing, and every selector lookup resolves to an empty node so the renderer stays on its normal
// path.
function fakeNode() {
  const node = {
    ownerDocument: fakeDocument,
    className: "",
    id: "",
    attributes: [],
    hidden: false,
    textContent: "",
    innerHTML: "",
    dataset: {},
    children: [],
    clientWidth: 0,
    clientHeight: 0,
    style: {
      setProperty() {},
      removeProperty() {},
      getPropertyValue() {
        return "";
      },
      transform: "",
    },
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains: () => false,
    },
    setAttribute() {},
    setAttributeNS() {},
    removeAttribute() {},
    getAttribute: () => null,
    getAttributeNS: () => null,
    append(...children) {
      node.children.push(...children);
    },
    prepend(...children) {
      node.children.unshift(...children);
    },
    appendChild(child) {
      node.children.push(child);
      return child;
    },
    insertBefore(child) {
      node.children.unshift(child);
      return child;
    },
    replaceChildren(...children) {
      node.children = children;
    },
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => fakeNode(),
    querySelectorAll: () => [],
    matches: () => false,
    closest: () => null,
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    focus() {},
    blur() {},
  };
  return node;
}

const fakeDocument = {
  hidden: false,
  createElement: () => fakeNode(),
  createElementNS: () => fakeNode(),
};

function installFakeDom() {
  global.document = fakeDocument;
  global.HTMLElement = class {};
  global.HTMLImageElement = class {};
}

module.exports = { fakeNode, installFakeDom };
