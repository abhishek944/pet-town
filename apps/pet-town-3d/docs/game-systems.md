# Game systems, assets and UI

[Back to architecture and lifecycle](../ARCHITECTURE.md).

## Existing game integration APIs

These are the live context APIs established by the recovered systems. Apply the [selected-companion proxy caveat](../ARCHITECTURE.md#desktop-integration-boundary) when the Pet Town extension is active:

| API                                                             | Purpose                                                                                                                                                   |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context.player.position`, `.velocity`, `.head`, `.forward`     | Current player transforms and motion. Treat these shared vectors as read-only; clone before modifying.                                                    |
| `context.player.teleport(x, y, z)`                              | Move the player and synchronize physics, rendering and camera. Pass `undefined` for `y` to choose the landing height.                                     |
| `context.player.setInputEnabled(enabled)`                       | Toggle player movement input. Camera input is handled separately.                                                                                         |
| `context.player.on(event, listener)`                            | Subscribe to player events and receive an unsubscribe function. Events include `jump`, `land`, `splash`, `glide`, `step`, `paddle`, `bonk` and `respawn`. |
| `context.player.introDolly(durationOrOptions)`                  | Request the intro camera movement; options include `dur` and `from`. Returns whether it started.                                                          |
| `context.props.nearest(position, typeOrPredicate, maxDistance)` | Find a prop entry. The type argument may be a string or predicate.                                                                                        |
| `context.props.isBlocked(x, z, padding)`                        | Query prop obstacles.                                                                                                                                     |
| `context.props.walkHeight(x, z)`                                | Find the highest prop walk surface, or `null`.                                                                                                            |
| `context.props.rebuild(full = true)`                            | Rebuild props, or reseat existing props with `false`.                                                                                                     |
| `context.creatures`                                             | Live creature actor array.                                                                                                                                |
| `context.creatureAt(raycaster)`                                 | Pick the nearest creature, or return `null`.                                                                                                              |
| `context.petCreature(creature)`                                 | Trigger affection, happy animation, icons, sound and the pet event.                                                                                       |

Use the controllers for actions rather than assigning mesh positions directly. `context.player.body`, `.character`, `.camera`, `.input`, `.world` and `.params` expose lower-level objects when a feature needs them. Their owning modules are [`src/player/system/initialize-player.js`](../src/player/system/initialize-player.js) and [`src/player/system/update-player.js`](../src/player/system/update-player.js).

Petting dispatches a `creature:pet` event on `window`; `event.detail.creature` is the actor. Creature initialization and interaction live in [`src/creatures/system/initialize-creatures.js`](../src/creatures/system/initialize-creatures.js) and [`src/creatures/interaction/pet-creature.js`](../src/creatures/interaction/pet-creature.js). `context.creatureSpecies` contains display summaries only; edit the full species catalog to change behavior or models.

## Add a creature or change its palette

[`src/creatures/species/catalog/prepare.js`](../src/creatures/species/catalog/prepare.js) initializes `creaturesState.creatureSpeciesDefinitions` by assembling individual definition factories. Each definition supplies its unique `id`, display text, `build(variant)` function, `variants`, habitat, population count, body dimensions, gait, speeds and behavior traits. For example, [`src/creatures/species/catalog/create-nimbaa-definition.js`](../src/creatures/species/catalog/create-nimbaa-definition.js) owns Nimbaa's palette variants and movement settings.

To add a palette-based species safely, append this inside that preparation function after the existing catalog assignment:

```js
const base = creaturesState.creatureSpeciesDefinitions.find((species) => species.id === "nimbaa");
creaturesState.creatureSpeciesDefinitions.push({
  ...base,
  id: "meadow-lamb",
  name: "Meadow Lamb",
  blurb: "A green-wool lamb that wanders the meadow.",
  count: 2,
  biomes: [...base.biomes],
  traits: { ...base.traits },
  variants: [{ ...base.variants[0], woolMid: 0x9edcaa }],
});
```

This reuses the existing Nimbaa builder while preserving every palette field it requires. Its implementation is [`src/creatures/species/nimbaa/build-nimbaa-creature.js`](../src/creatures/species/nimbaa/build-nimbaa-creature.js). For a new body shape, add a builder and use that function as the definition's `build` value.

Builders receive the selected palette object and return `{ root, face }`. The rig must retain the expected `bob`, `body` and `head` groups. Optional named eye/mouth parts and the `userData.leg`, `userData.wing` and `userData.jiggle` metadata connect the model to animation. Reuse the helpers in `src/creatures/rig-builders/` and follow an existing species rather than returning an arbitrary mesh.

[`src/creatures/prefabs/get-creature-prefab.js`](../src/creatures/prefabs/get-creature-prefab.js) caches each `id:variantIndex`, bakes its meshes and clones independent rigs for actors. Most visible colors become vertex colors during construction. Change the species definition or builder and reload to see palette changes; changing a palette object after spawning does not recolor baked meshes. Keep IDs unique and preserve the movement/body settings when reusing a rig.

Player colors are initialized separately in [`src/player/palette/prepare.js`](../src/player/palette/prepare.js) as `playerState.playerPalette`. Change those named costume and facial colors there. Shared creature shading is configured by [`src/creatures/materials/get-creature-materials.js`](../src/creatures/materials/get-creature-materials.js); per-species color variants belong in their definition factories.

The public player and creature classes delegate to behavior helpers beside them. Player physics separates velocity integration, collision sweeps, ledge support and walk-surface snapping. Creature actors separate decisions, movement, body animation, expressions and jiggle motion. Species builders similarly delegate named body parts. The helpers preserve the original controller receiver through explicit `.call(this, ...)` where they need it; keep those calls attached to the same actor when extending behavior.

## Three, shader and UI assets

[`package.json`](../package.json) pins the ordinary `three` package. Modules import Three directly; geometry utilities and postprocessing use its `three/addons/` modules. There is no separate recovered copy of the Three library to edit. Keep package and addon versions together when updating the dependency.

Substantial shader, CSS and HTML text lives beside its owning feature under `assets/`. JavaScript imports these source files with Vite's `?raw` suffix. Some shaders consist of several imported sections joined with calculated parameters; preserve their order and interpolation sites. Smaller shader snippets remain close to their material setup code.

Runtime-created style elements must use `installGameStyles(id, css)` from
`src/core/install-game-styles.js`. It copies the native page's allowed style nonce
before insertion and also works on ordinary Vite pages. Creating an untagged
inline style can work in development while failing in the packaged WebView.

The models, textures, icons and much of the scenery are procedural source assets. Their colors, dimensions and drawing commands are editable in the relevant builders. `npm run build` creates the deployable bundle from this source; extend the files under `src/` and rebuild rather than modifying build output.

### Approved UI surfaces

The welcome sign and compact HUD styles live under `hud/styles/assets/`; local fonts and licenses are in `public/fonts/`. `hud/settings/create-town-settings.js` owns H tabs and dialog focus, and `companion-controls.js` sends selected-companion actions through the existing extension/controller/bridge. World settings call `context.audio` only. Reset remains a separate confirmation.

`pet-town/ui/roster-rows.js` keys portrait rows by the stable opaque ID so polling does not replace focused rows or reset scrolling. `agents/appearance-identity.js` supplies the same hue/accessory identity to the 3D model and UI SVG. Portrait labels use textContent; public duplicate names gain a display ordinal rather than exposing a route or ID. The picker owns keyboard input while open and blocks building material changes from its scrolling.

Mayor's view keeps the native voice lifecycle in `mayor/index.js` and `talk.js`. H moves the card beneath the scrim and makes it inert while speech continues. The reply scrolls at 144px maximum, and collapse never sends a stop action.

### 3D pet library

`pet-town/pets/catalog.js` defines the eight approved woodland/storybook pets. Its geometry builders feed both gameplay characters and gallery previews/portraits, so changing a pet does not rely on a separate 2D icon. `pets/character.js` implements the existing companion presentation/physics event interface. The original player and default golden Mayor continue using the legacy explorer character.

`agents/pet-assignments.js` stores versioned per-opaque-ID pet choices in the town’s existing local storage namespace, independently of 2D preferences and world saves. Ordinary companions get deterministic catalog defaults. `agents/character-visual.js` replaces the visual portion of an existing record; it preserves physics, roaming, identity, input, control and first-person visibility. Saving precedes applying. Departed/invalid records and storage errors are reported, and failed candidate resources are disposed.

The H gallery owns its preview draft and rendering lifecycle. A draft captures the target companion when opened, rather than following later selection changes. The preview pauses while hidden; thumbnails are cached with bounded renderer ownership. `ui/roster-rows.js` retains existing row nodes while refreshing a changed pet portrait. This feature does not alter the private focus helper or native bridge and remains excluded from the public build.

## Terrain edit updates

Individual block edits update terrain chunks and the existing props, water and
vegetation subscriptions. The world-assets extension must not replan the whole
village or vegetation on every terrain version change. Saved block replay uses
those same subscriptions; deliberate asset-library operations own full layout
changes. Local foliage caches retain original instances, tree collisions and
reflection/shadow ranges so repairing a cell or undoing its edit restores the
same vegetation, including after saved block replay.

Wall shading retains its two 3×3 filters, updating only their 3×3 input and 5×5
output neighborhoods when a column top changes. Prop reseating updates only that
record's material ranges, collisions, roof offsets and ground effects. An
unsupported authored asset stays as a hidden record, including after reload, so
repairing its terrain support restores the same geometry and metadata locally.

Each published prop range has a `version` for camera-query geometry updates.
Increment it when modifying its vertices; the GPU attribute update alone covers
all props sharing that material and is too broad for collision invalidation.
Visibility changes also replace the published ranges-map identity, so the camera
inventory removes or restores the affected sources. Moved records expand their
shared batch's bounds conservatively without scanning unrelated vertices.
