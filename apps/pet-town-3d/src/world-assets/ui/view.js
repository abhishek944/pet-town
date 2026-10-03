import { WORLD_ASSETS } from "../../props/collection/catalog.js";

export function createLibraryView(onSelect) {
  const root = document.createElement("div");
  root.className = "asset-library-ui";
  root.dataset.townUi = "asset-library";
  root.innerHTML = `<button type="button" class="asset-library-toggle" aria-controls="asset-library-dialog" aria-expanded="false">✿ Asset library <kbd>K</kbd></button>
    <div class="asset-library-overlay" hidden><section id="asset-library-dialog" class="asset-library-dialog" role="dialog" aria-modal="true" aria-labelledby="asset-library-title">
      <header><div><span class="asset-library-eyebrow">Make a place your own</span><h2 id="asset-library-title">Asset library</h2></div><button type="button" data-close aria-label="Close asset library">✕</button></header>
      <p class="asset-library-note">26 crafted buildings, seats, lights and little landmarks. Choose one, check its preview, then place it deliberately.</p>
      <div class="asset-library-layout"><div class="asset-library-catalog"><label>Collection<select data-category><option value="all">All 26 designs</option></select></label><div class="asset-library-cards" aria-label="Available assets"></div></div>
      <div class="asset-library-detail"><div class="asset-library-preview" data-preview role="img" aria-label="Selected asset 3D preview"></div>
        <h3 data-name></h3><p class="asset-library-note" data-footprint></p>
        <div class="asset-library-adjustments"><button type="button" data-turn>Turn 90°</button><span data-angle></span></div>
        <label>Distance ahead <output data-distance-label></output><input data-distance type="range" min="5" max="24" step="1" value="12" aria-label="Distance ahead in metres"></label>
        <p class="asset-library-note" data-placement role="status" aria-live="polite"></p><button type="button" class="asset-library-primary" data-add>Add to this spot</button>
        <div class="asset-library-replace"><label>Replace a nearby asset<select data-target><option value="">New asset: use the spot ahead</option></select></label><p class="asset-library-note">Check the name, distance and coordinates against the highlighted spot before replacing. Replacement keeps that spot. Choose “New asset” to add ahead again.</p><p class="asset-library-note" data-target-detail aria-live="polite" hidden></p><button type="button" data-replace disabled>Replace selected asset</button><button type="button" data-restore hidden disabled>Restore original asset</button></div>
        <button type="button" data-undo>Undo latest asset change</button>
        <p class="asset-library-error" data-error role="alert" hidden></p><p class="asset-library-note" data-result role="status" aria-live="polite"></p>
      </div></div><p class="asset-library-note">Walk to a new spot before opening the library. Decks, stairs and interiors are decorative. K or Escape closes. H opens help; P takes a photo.</p>
    </section></div>`;
  const query = (selector) => root.querySelector(selector);
  for (const category of new Set(WORLD_ASSETS.map((asset) => asset.category))) {
    query("[data-category]").add(new Option(category, category));
  }
  const cards = WORLD_ASSETS.map((asset) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "asset-library-card";
    card.dataset.category = asset.category;
    card.setAttribute("aria-pressed", "false");
    const name = document.createElement("strong");
    name.textContent = asset.name;
    const category = document.createElement("small");
    category.textContent = asset.category;
    card.append(name, category);
    card.onclick = () => onSelect(asset.id);
    query(".asset-library-cards").append(card);
    return { asset, card };
  });
  query("[data-category]").onchange = (event) => {
    for (const { asset, card } of cards)
      card.hidden = event.target.value !== "all" && asset.category !== event.target.value;
  };
  document.body.append(root);
  return { root, query, cards };
}
