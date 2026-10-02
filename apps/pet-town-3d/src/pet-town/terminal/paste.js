/** A complete wrapper lets Herdr apply the original application's actual paste mode. */
export function bindServerPaste(screen, { enabled, send, onNotice, onSubmit }, signal) {
  const encoder = new TextEncoder();
  screen.addEventListener(
    "paste",
    async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!enabled()) {
        onNotice("Interact before pasting into this terminal.");
        return;
      }
      let text;
      try {
        text = event.clipboardData?.getData("text/plain");
      } catch {
        onNotice("Clipboard text was unavailable. Nothing was pasted.");
        return;
      }
      if (text === undefined) {
        onNotice("Clipboard text was unavailable. Nothing was pasted.");
        return;
      }
      if (!text) return;
      if (text.length > 47_988) {
        onNotice("This paste exceeds 48 KB. Paste a smaller selection or use Herdr.");
        return;
      }
      if (text.includes("\x1b[200~") || text.includes("\x1b[201~")) {
        onNotice("Clipboard text contains terminal paste controls. Nothing was pasted.");
        return;
      }
      const wrapped = `\x1b[200~${text}\x1b[201~`;
      if (encoder.encode(wrapped).length > 48_000) {
        onNotice("This paste exceeds 48 KB. Paste a smaller selection or use Herdr.");
        return;
      }
      const accepted = onSubmit();
      if (await send({ type: "terminal.input", text: wrapped })) accepted();
    },
    { capture: true, signal },
  );
}
