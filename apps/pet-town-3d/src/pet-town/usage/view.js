import "./usage.css";

const number = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});
const credits = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });
const metrics = [
  ["inputTokens", "Input"],
  ["outputTokens", "Output"],
  ["cachedInputTokens", "Cached input"],
  ["reasoningOutputTokens", "Reasoning"],
];

function createCard(kind, title) {
  const root = document.createElement(kind === "town" ? "details" : "section");
  root.className = `town-usage-card town-usage-${kind}`;
  root.innerHTML = `
    <${kind === "town" ? "summary" : "header"}>
      <span class="town-usage-title"></span>
      <strong class="town-usage-total">—</strong>
      <span class="town-usage-unit">tokens</span>
      <span class="town-usage-model"></span>
    </${kind === "town" ? "summary" : "header"}>
    <dl class="town-usage-metrics"></dl>
    <p class="town-usage-price"></p>
    <p class="town-usage-note"></p>`;
  const el = (name) => root.querySelector(`.town-usage-${name}`);
  el("title").textContent = title;
  const fields = metrics.map(([key, label]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const value = document.createElement("dd");
    el("metrics").append(term, value);
    return { key, value };
  });
  return {
    root,
    render(reading, name, subtitle, fallback) {
      const measured = ["measured", "partial"].includes(reading?.status);
      const count = (value) =>
        measured && Number.isSafeInteger(value) && value >= 0 ? number.format(value) : "—";
      const total = count(reading?.totalTokens);
      el("title").textContent = name;
      el("title").title = name;
      el("total").textContent = total === "—" ? total : compact.format(reading.totalTokens);
      el("total").title = total === "—" ? "Usage unavailable" : `${total} tokens`;
      el("model").textContent = subtitle;
      el("model").title = subtitle;
      for (const { key, value } of fields) value.textContent = count(reading?.[key]);
      const estimate = reading?.estimatedCredits;
      el("price").textContent =
        measured && Number.isFinite(estimate) && estimate >= 0
          ? `Est. standard credits · ${estimate > 0 && estimate < 0.001 ? "<0.001" : credits.format(estimate)}`
          : "Est. standard credits · unavailable";
      el("price").title =
        "Published Codex standard credit rates. Not billed cost or subscription allowance.";
      el("note").textContent = !measured
        ? reading?.reason === "fork-inherited-history"
          ? "Inherited fork history · separate usage is unavailable"
          : fallback
        : reading.status === "partial"
          ? "Partial readings · some usage is unavailable"
          : "Recorded usage · cached input is included in input";
      root.dataset.status = measured ? reading.status : "unavailable";
    },
  };
}

export function createUsageView() {
  const root = document.createElement("aside");
  root.className = "town-usage";
  root.dataset.townUi = "usage";
  root.setAttribute("aria-label", "Codex token usage");
  root.hidden = true;
  const town = createCard("town", "Town usage");
  const companion = createCard("companion", "Following");
  companion.root.hidden = true;
  root.append(town.root, companion.root);
  document.body.append(root);
  const listeners = new AbortController();
  for (const type of ["pointerdown", "mousedown", "click", "dblclick", "wheel"]) {
    root.addEventListener(type, (event) => event.stopPropagation(), { signal: listeners.signal });
  }
  root.addEventListener(
    "keydown",
    (event) => {
      if (["Space", "Enter"].includes(event.code)) event.stopPropagation();
    },
    { signal: listeners.signal },
  );
  return {
    root,
    render(usage, selected, connected) {
      const measured = Number.isSafeInteger(usage?.measuredSessions) ? usage.measuredSessions : 0;
      const tracked = Number.isSafeInteger(usage?.trackedSessions) ? usage.trackedSessions : 0;
      const models = usage?.totals?.models;
      const modelCount = Array.isArray(models) ? models.length : 0;
      town.render(
        connected && usage?.available ? usage.totals : null,
        "Town usage",
        `Codex · ${measured}/${tracked} tracked sessions${modelCount ? ` · ${modelCount} ${modelCount === 1 ? "model" : "models"}` : ""}`,
        !connected
          ? "Desktop connection unavailable"
          : !usage?.available
            ? "Usage collector unavailable"
            : tracked
              ? "Waiting for recorded usage"
              : "Connect Codex and start a session to track usage",
      );
      companion.root.hidden = !selected;
      if (!selected) return;
      const reading = connected && usage?.available ? usage.byAgent?.[selected.id] : null;
      companion.render(
        reading,
        `Following · ${selected.label}`,
        reading?.model || (selected.source === "codex" ? "Codex" : "Usage unavailable"),
        !connected
          ? "Desktop connection unavailable"
          : selected.source === "codex"
            ? "Waiting for this session’s recorded usage"
            : "Usage is currently available for tracked Codex sessions",
      );
    },
    dispose() {
      listeners.abort();
      root.remove();
    },
  };
}
