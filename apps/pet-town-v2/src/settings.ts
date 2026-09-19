import { invoke } from "@tauri-apps/api/core";
import { loadCapabilityMappings, resetCapabilityMappings } from "./pets";
import {
  applyAppearance,
  clearBrowserPreferences,
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type V2Preferences,
} from "./preferences";
import {
  aboutPage,
  agentsPage,
  appDataPage,
  assistantPage,
  gameplayPage,
  petsPage,
  SETTINGS_SECTIONS,
  type SectionId,
} from "./settings-pages";
import { StudioSettings } from "./studio-settings";

async function start(): Promise<void> {
  await loadCapabilityMappings();
  const root = document.querySelector<HTMLElement>("#settings-root");
  if (!root) throw new Error("settings root is missing");
  let saved = await loadPreferences();
  let draft: V2Preferences = { ...saved };
  let current: SectionId = "gameplay";
  let saving = false;
  let footerMessage: string | null = null;
  const studio = new StudioSettings(() => render());

  root.innerHTML = `<div class="window"><div class="shell"><aside class="sidebar"><div class="brand"><span>🐾</span><b>Pet Town v2<small>Settings</small></b></div><nav aria-label="Settings sections">${SETTINGS_SECTIONS.map((section) => `<button type="button" data-section="${section.id}"><i aria-hidden="true">${section.icon}</i>${section.label}</button>`).join("")}</nav></aside><main id="content" class="content" tabindex="-1"></main></div><footer><button id="reset" class="button secondary" type="button">Reset changes</button><span id="dirty" role="status"></span><button id="apply" class="button primary" type="button">Apply</button></footer></div>`;

  document.body.classList.remove("settings-loading");
  applyAppearance(draft);
  function required<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Required settings control is missing: ${selector}`);
    return element;
  }
  const content = required<HTMLElement>("#content");
  const dirty = required<HTMLElement>("#dirty");
  const apply = required<HTMLButtonElement>("#apply");
  const reset = required<HTMLButtonElement>("#reset");

  function isDirty(): boolean {
    return JSON.stringify(saved) !== JSON.stringify(draft);
  }
  function updateFooter(message?: string): void {
    if (message !== undefined) footerMessage = message;
    const changed = isDirty();
    apply.disabled = !changed || saving;
    reset.disabled = !changed || saving;
    dirty.textContent = footerMessage ?? (changed ? "Unapplied changes" : "All changes saved");
  }

  function switchControl(key: keyof V2Preferences, label: string, description: string): string {
    const id = `pref-${String(key)}`;
    return `<div class="row"><span><b id="${id}-label">${label}</b><small id="${id}-description">${description}</small></span><button type="button" class="switch" role="switch" aria-checked="${String(Boolean(draft[key]))}" aria-labelledby="${id}-label" aria-describedby="${id}-description" data-pref="${String(key)}"><span></span></button></div>`;
  }

  function render(): void {
    if (current !== "studio") studio.deactivate();
    document.querySelectorAll<HTMLButtonElement>("[data-section]").forEach((button) => {
      const selected = button.dataset.section === current;
      button.classList.toggle("selected", selected);
      if (selected) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    content.innerHTML =
      current === "gameplay"
        ? gameplayPage(draft, switchControl)
        : current === "studio"
          ? studio.markup()
          : current === "pets"
            ? petsPage(draft, switchControl)
            : current === "assistant"
              ? assistantPage(switchControl)
              : current === "app"
                ? appDataPage(switchControl)
                : current === "agents"
                  ? agentsPage()
                  : aboutPage();
    bindContent();
    content.focus();
    updateFooter();
  }

  function bindContent(): void {
    content.querySelectorAll<HTMLButtonElement>(".switch[data-pref]").forEach((button) =>
      button.addEventListener("click", () => {
        const key = button.dataset.pref as keyof V2Preferences;
        (draft as unknown as Record<string, unknown>)[key] = !draft[key];
        footerMessage = null;
        applyAppearance(draft);
        render();
      }),
    );
    content.querySelectorAll<HTMLSelectElement>("select[data-pref]").forEach((select) => {
      const key = select.dataset.pref as keyof V2Preferences;
      select.value = String(draft[key]);
      select.addEventListener("change", () => {
        (draft as unknown as Record<string, unknown>)[key] = select.value;
        footerMessage = null;
        applyAppearance(draft);
        updateFooter();
      });
    });
    const range = content.querySelector<HTMLInputElement>('input[data-pref="petScale"]');
    range?.addEventListener("input", () => {
      draft.petScale = Number(range.value);
      footerMessage = null;
      const output = range.parentElement?.querySelector("output");
      if (output) output.value = `${range.value}%`;
      updateFooter();
    });
    content.querySelector("#open-playroom")?.addEventListener("click", () => {
      if (!("__TAURI_INTERNALS__" in window)) {
        window.open("/playroom.html", "_blank");
        return;
      }
      void invoke("open_playroom").catch((error: unknown) =>
        updateFooter(error instanceof Error ? error.message : "Could not open the Playroom"),
      );
    });
    if (current === "studio") studio.bind(content);
    content.querySelector("#reset-all")?.addEventListener("click", () => {
      if (
        !window.confirm(
          "Reset all v2 preferences and capability mappings? The current app is not affected.",
        )
      )
        return;
      void (
        "__TAURI_INTERNALS__" in window
          ? invoke<V2Preferences>("reset_v2_data")
          : Promise.resolve().then(() => {
              clearBrowserPreferences();
              return { ...DEFAULT_PREFERENCES };
            })
      )
        .then((preferences) => {
          resetCapabilityMappings();
          footerMessage = null;
          saved = preferences;
          draft = { ...preferences };
          applyAppearance(draft);
          render();
        })
        .catch((error: unknown) =>
          updateFooter(error instanceof Error ? error.message : "Could not reset v2 data"),
        );
    });
  }

  document.querySelectorAll<HTMLButtonElement>("[data-section]").forEach((button) =>
    button.addEventListener("click", () => {
      current = button.dataset.section as SectionId;
      render();
    }),
  );
  apply.addEventListener("click", async () => {
    const submitted = { ...draft };
    saving = true;
    content
      .querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(
        "input, select, button",
      )
      .forEach((control) => {
        control.disabled = true;
      });
    updateFooter("Saving…");
    try {
      saved = await savePreferences(submitted);
      if (JSON.stringify(draft) === JSON.stringify(submitted)) draft = { ...saved };
      updateFooter("Saved");
    } catch (error) {
      updateFooter(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      saving = false;
      render();
    }
  });
  reset.addEventListener("click", () => {
    footerMessage = null;
    draft = { ...saved };
    applyAppearance(draft);
    render();
  });
  render();
}

void start();
