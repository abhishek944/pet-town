import { invoke } from "@tauri-apps/api/core";

export interface AdapterSetupView {
  id: "herdr" | "claude" | "codex" | "opencode" | "pi" | "factory" | "cursor";
  name: string;
  mechanism: string;
  status: "builtIn" | "installed" | "verificationRequired" | "disabled" | "notInstalled" | "needsUpdate" | "error" | "conflict";
  statusLabel: string;
  action: "connect" | "update" | "remove" | null;
  capabilities: string[];
}

type AdapterId = AdapterSetupView["id"];
interface OverviewCard {
  ids: AdapterId[];
  name: string;
  glyph: string;
  subtitle: (items: AdapterSetupView[]) => string;
  directConnect?: AdapterId;
}

const overviewCards: OverviewCard[] = [
  { ids: ["herdr"], name: "Herdr", glyph: "H", subtitle: () => "Authoritative session host" },
  { ids: ["claude"], name: "Claude Code", glyph: "C", subtitle: ([item]) => item.status === "installed" ? "Hooks installed" : "Hooks available" },
  { ids: ["codex"], name: "Codex", glyph: "◎", subtitle: ([item]) => item.status === "verificationRequired" ? "Hooks installed; verify trust" : item.status === "installed" ? "Hooks installed" : "Not configured", directConnect: "codex" },
  { ids: ["opencode"], name: "OpenCode", glyph: "O", subtitle: ([item]) => item.status === "installed" ? "Plugin installed" : "Plugin available", directConnect: "opencode" },
  { ids: ["pi"], name: "Pi", glyph: "π", subtitle: ([item]) => item.status === "installed" ? "Extension installed" : "Extension available" },
  { ids: ["factory", "cursor"], name: "Factory & Cursor", glyph: "+2", subtitle: (items) => {
    const connected = items.filter((item) => item.status === "installed").length;
    return connected ? `${connected} of 2 connected` : "More adapters";
  } },
];

function text(className: string, value: string): HTMLElement {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = value;
  return element;
}

function stateGuidance(adapter: AdapterSetupView): string {
  const guidance: Partial<Record<AdapterSetupView["status"], string>> = {
    verificationRequired: "Next: open Codex and run /hooks to verify whether this exact hook is trusted.", disabled: "Next: allow user hooks and enable the hooks feature in Codex, then return here.", conflict: "Next: move or rename the existing file, then return here to connect.", error: "Next: repair the malformed configuration shown by your agent, then return here."
  };
  return guidance[adapter.status] ?? "Keeps only opaque identity, status, time, a safe label, and optional local routing hints.";
}

function combinedStatus(items: AdapterSetupView[]): { status: AdapterSetupView["status"]; label: string } {
  if (items.every((item) => item.status === "builtIn")) return { status: "builtIn", label: "Built in" };
  if (items.every((item) => item.status === "installed")) return { status: "installed", label: "Connected" };
  if (items.some((item) => item.status === "verificationRequired")) return { status: "verificationRequired", label: "Verify" };
  if (items.some((item) => item.status === "disabled")) return { status: "disabled", label: "Disabled" };
  if (items.some((item) => item.status === "conflict")) return { status: "conflict", label: "File in use" };
  if (items.some((item) => item.status === "error")) return { status: "error", label: "Config error" };
  if (items.some((item) => item.status === "needsUpdate")) return { status: "needsUpdate", label: "Update" };
  if (items.some((item) => item.status === "installed")) return { status: "installed", label: "Manage" };
  return { status: "notInstalled", label: "Setup" };
}
export class AdapterSettings {
  private readonly cards = document.getElementById("adapter-cards")!;
  private adapters: AdapterSetupView[] = [];
  private busyId: string | null = null;
  constructor(private readonly report: (message: string) => void) {}
  async load(): Promise<void> {
    this.cards.setAttribute("aria-busy", "true");
    try {
      this.adapters = await invoke<AdapterSetupView[]>("list_adapter_setups");
      this.report("");
      this.renderOverview();
    } catch (error) {
      this.cards.replaceChildren(text("adapter-card-error", `Could not inspect agent connections. ${String(error)}`));
      this.report("Could not inspect agent connections.");
    } finally {
      this.cards.setAttribute("aria-busy", "false");
    }
  }

  private items(ids: AdapterId[]): AdapterSetupView[] {
    return ids.map((id) => this.adapters.find((item) => item.id === id)).filter((item): item is AdapterSetupView => Boolean(item));
  }

  private renderOverview(focusIds?: AdapterId[]): void {
    this.cards.classList.remove("adapter-detail-view");
    this.cards.setAttribute("role", "list");
    this.cards.replaceChildren(...overviewCards.map((definition) => this.overviewCard(definition)));
    if (focusIds) this.cards.querySelector<HTMLElement>(`[data-adapter-card="${focusIds.join("-")}"] .adapter-card-open`)?.focus();
  }

  private overviewCard(definition: OverviewCard): HTMLElement {
    const items = this.items(definition.ids);
    const statusValue = combinedStatus(items);
    const card = document.createElement("article");
    card.className = "adapter-card";
    card.setAttribute("role", "listitem");
    card.dataset.adapterCard = definition.ids.join("-");
    const open = document.createElement("button");
    open.type = "button";
    open.className = "adapter-card-open";
    open.setAttribute("aria-label", `${definition.name}: ${statusValue.label}. Open connection details.`);
    open.addEventListener("click", () => this.renderDetail(definition));

    const header = document.createElement("div");
    header.className = "adapter-card-header";
    const logo = text("adapter-logo", definition.glyph);
    logo.setAttribute("aria-hidden", "true");
    const identity = document.createElement("span");
    identity.className = "adapter-identity";
    identity.append(text("adapter-name", definition.name), text("adapter-mechanism", definition.subtitle(items)));
    const status = text("adapter-status", statusValue.label);
    status.setAttribute("role", "status");
    status.dataset.status = statusValue.status;
    header.append(logo, identity, status);
    open.append(header);

    if (definition.ids[0] === "herdr" || definition.ids[0] === "claude" && items[0]?.status === "installed") {
      const capabilities = document.createElement("div");
      capabilities.className = "adapter-capabilities";
      capabilities.append(...items[0].capabilities.slice(0, definition.ids[0] === "herdr" ? 2 : 3).map((item) => text("adapter-capability", item)));
      open.append(capabilities);
    } else if (definition.directConnect && (items[0]?.action === "connect" || items[0]?.action === "update")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary adapter-action";
      button.textContent = items[0].action === "update" ? "Update…" : "Connect…";
      button.setAttribute("aria-label", `${items[0].action === "update" ? "Update" : "Connect"} ${items[0].name}`);
      button.disabled = this.busyId !== null;
      button.addEventListener("click", () => { void this.apply(items[0], definition, false); });
      card.append(open, button);
      return card;
    }
    card.append(open);
    return card;
  }

  private renderDetail(definition: OverviewCard, focusAdapter?: AdapterId): void {
    this.cards.classList.add("adapter-detail-view");
    this.cards.setAttribute("role", "group");
    const heading = document.createElement("div");
    heading.className = "adapter-detail-heading";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "secondary adapter-back";
    back.textContent = "‹ Connections";
    back.addEventListener("click", () => this.renderOverview(definition.ids));
    const title = document.createElement("h2");
    title.textContent = definition.name;
    heading.append(back, title);

    const rows = this.items(definition.ids).map((adapter) => {
      const row = document.createElement("article");
      row.className = "adapter-detail-row";
      const copy = document.createElement("div");
      const capabilities = document.createElement("div");
      capabilities.className = "adapter-capabilities";
      capabilities.append(...adapter.capabilities.map((item) => text("adapter-capability", item)));
      copy.append(text("adapter-name", adapter.name), text("adapter-detail-copy", `${adapter.mechanism}. ${stateGuidance(adapter)}`), capabilities);
      const status = text("adapter-status", adapter.statusLabel);
      status.setAttribute("role", "status");
      status.dataset.status = adapter.status;
      row.append(copy, status);
      if (adapter.action) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "secondary adapter-action";
        button.textContent = adapter.action === "remove" ? "Remove…" : adapter.status === "needsUpdate" ? "Update…" : "Connect…";
        button.setAttribute("aria-label", `${adapter.action === "remove" ? "Remove" : adapter.status === "needsUpdate" ? "Update" : "Connect"} ${adapter.name}`);
        button.dataset.adapterAction = adapter.id;
        button.disabled = this.busyId !== null;
        button.addEventListener("click", () => { void this.apply(adapter, definition, true); });
        row.append(button);
      }
      return row;
    });
    this.cards.replaceChildren(heading, ...rows);
    const target = focusAdapter ? this.cards.querySelector<HTMLElement>(`[data-adapter-action="${focusAdapter}"]`) : null;
    const focused = target ?? back; focused.classList.add("restored-focus"); focused.focus();
    focused.addEventListener("blur", () => focused.classList.remove("restored-focus"), { once: true });
  }

  private async apply(adapter: AdapterSetupView, returnTo?: OverviewCard, stayInDetail = false): Promise<void> {
    const operation = adapter.action === "remove" ? "remove" : adapter.action === "update" ? "update" : "connect";
    const enabled = operation !== "remove";
    const message = operation === "remove" ? `Remove the managed ${adapter.name} integration? Your other settings will be kept.`
      : `${operation === "update" ? "Update" : "Connect"} ${adapter.name}? Agent Pets will ${operation === "update" ? "replace only its marked integration in" : "add a marked local integration to"} your global ${adapter.mechanism.toLowerCase()} configuration. Existing settings stay in place and changed files are backed up.`;
    if (!confirm(message)) return;
    this.busyId = adapter.id;
    if (stayInDetail && returnTo) this.renderDetail(returnTo); else this.renderOverview(returnTo?.ids);
    this.report(`${operation === "remove" ? "Removing" : operation === "update" ? "Updating" : "Connecting"} ${adapter.name}…`);
    try {
      this.adapters = await invoke<AdapterSetupView[]>("set_adapter_enabled", { id: adapter.id, enabled });
      this.report(this.adapters.find((item) => item.id === adapter.id)?.status === "verificationRequired" ? `${adapter.name} installed. Verify trust in Codex with /hooks.` : `${adapter.name} ${operation === "remove" ? "removed" : operation === "update" ? "updated" : "connected"}.`);
    } catch (error) {
      this.report(String(error));
    } finally {
      this.busyId = null;
      if (stayInDetail && returnTo) this.renderDetail(returnTo, adapter.id); else this.renderOverview(returnTo?.ids);
    }
  }
}
