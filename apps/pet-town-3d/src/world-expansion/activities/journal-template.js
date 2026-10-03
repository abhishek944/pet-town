import { journalArt } from "./journal-art.js";

export function journalTemplate(actions) {
  const tabs = ["Experiences", "Places", "Collection"];
  return `<button type="button" class="sunmeadow-toggle" aria-expanded="false" aria-controls="sunmeadow-journal">✿ Journal <kbd>J</kbd></button>
    <div class="sunmeadow-overlay" hidden><section class="sunmeadow-journal" id="sunmeadow-journal" data-trail-dialog role="dialog" aria-modal="true" aria-labelledby="sunmeadow-title">
    <header><div><span class="sunmeadow-eyebrow">Small adventures, lasting memories</span><h2 id="sunmeadow-title">Your island journal</h2></div><button type="button" class="sunmeadow-close" aria-label="Close journal">✕</button></header>
    <p class="sunmeadow-note">A flower to grow. A reef to find. A little farther to wander.</p>
    <div class="sunmeadow-summary"><span data-progress></span><progress value="0" aria-label="Places discovered"></progress></div>
    <button type="button" data-fishing-reminder hidden aria-live="polite"></button>
    <nav class="journal-tabs" role="tablist" aria-label="Journal pages">${tabs
      .map((label, index) => {
        const id = label.toLowerCase();
        return `<button type="button" role="tab" id="journal-tab-${id}" aria-controls="journal-page-${id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-page="${id}">${label}</button>`;
      })
      .join("")}</nav>
    <section class="journal-page" id="journal-page-experiences" role="tabpanel" aria-labelledby="journal-tab-experiences">
    <p class="sunmeadow-note">Choose a little adventure. Nearby hints help you find what to try next.</p>
    <div class="journal-experiences">
    <article class="sunmeadow-activity">${journalArt("garden")}<h3>Your picnic flower bed</h3><p class="journal-meta" data-experience-meta="picnic"></p><p data-garden-note></p><button type="button" class="sunmeadow-action" data-garden></button><button type="button" data-find-place="picnic">Find the garden</button></article>
    ${actions.willowmere ? "<div data-willowmere-activities></div>" : ""}
    ${actions.shellhaven ? "<div data-shellhaven-activities></div>" : ""}
    <article class="sunmeadow-activity">${journalArt("photo")}<h3>Collect a view</h3><p class="journal-meta" data-experience-meta="lookout"></p><p data-photo-note></p><button type="button" data-photo>Take a photo</button><button type="button" data-find-place="lookout">Find a lookout</button></article>
    <div data-extra-experiences></div></div></section>
    <section class="journal-page" id="journal-page-places" role="tabpanel" aria-labelledby="journal-tab-places" hidden>
    <p class="sunmeadow-note" data-travel-note></p><div class="journal-destinations"><section class="journal-destination-group"><h3 class="journal-section-title">Along the island trails</h3><div class="sunmeadow-places"></div></section>
    <section data-ocean-places hidden><h3 class="journal-section-title">Beyond the shore</h3><p class="sunmeadow-note">Choose a heading, then swim there at your own pace. Start at Driftwood Camp and walk west to the water.</p><div data-ocean-rows></div></section></div></section>
    <section class="journal-page" id="journal-page-collection" role="tabpanel" aria-labelledby="journal-tab-collection" hidden>
    <p class="sunmeadow-note">Your discoveries and little keepsakes, saved on this device.</p>
    <div data-garden-collection></div>${actions.willowmere ? "<div data-willowmere-collection></div>" : ""}${actions.shellhaven ? "<div data-shellhaven-collection></div>" : ""}
    <h3 class="journal-section-title">Places you have found</h3><div class="journal-collection-grid" data-place-collection></div></section>
    <p class="sunmeadow-error" role="alert" data-error hidden></p><p class="sunmeadow-error" role="alert" data-ocean-error hidden></p>
    <p class="sunmeadow-note">J or Escape closes your journal. Keep exploring; there is no hurry.</p>
    </section></div>`;
}
