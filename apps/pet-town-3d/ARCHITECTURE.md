# Extending Pet Town’s Three.js world

This app runs editable JavaScript modules through Vite. The recovered source preserves the reference game's procedural geometry, shaders, behavior and UI. The semantic module and function names describe their current responsibilities; they are not a claim that the original author's source files were recovered.

## Startup and frame lifecycle

[`src/main.js`](src/main.js) is the entry point. It calls `prepareGameData()`, creates the Three renderer, scene, camera and shared context, awaits the local Rapier camera-query runtime, and initializes the built-in systems in the order defined by [`src/core/systems.js`](src/core/systems.js):

1. Terrain
2. Sky
3. Water
4. Vegetation
5. Props
6. Player
7. Creatures
8. Particle effects
9. Building tools
10. HUD
11. Audio
12. Postprocessing

Terrain must be available before placement and collision queries. The player must be initialized before systems that consume its position, input and events. Preserve this order when changing startup.

The player and companion cameras share the geometry-query boundary and final-pose safety rules described in [Camera movement](docs/camera-movement.md). The isolated Rapier world answers camera queries; existing character physics continue to own actor movement.

The boat extension adds an optional `beforePlayerUpdate` phase immediately before player physics. Its hull pose and collisions update there; body-step hooks then carry each grounded passenger before that body integrates movement. See [water and boating](../../docs/water.md#harbor-launch).

After built-in initialization, the entry point creates `context.extensions`. Each animation frame updates `context.dt` and `context.time`, then calls built-in `update(deltaTime, context)` hooks in the same order. Immediately after the player update, it calls `context.extensions.afterPlayerUpdate(deltaTime)` and then `camera.updateMatrixWorld()`. This early extension phase updates companion movement and the following camera before creatures, particles, building, HUD, audio and postprocessing consume their current transforms. After all built-in updates, it calls the extensions’ late `update(deltaTime, context)` hooks, then renders postprocessing. `deltaTime` is in seconds and is capped by [`src/core/config.js`](src/core/config.js). The player also integrates its own fixed physics steps.

The live context is available as `window.petTownGame` and `window.__ctx` for development. Startup sets `context.ready = true` and dispatches `pet-town:ready` with the context in `event.detail`. This signals synchronous system initialization. Saved-world restoration is asynchronous: before a startup extension changes saved blocks, wait until `context.building.persistence.on` is false or `context.building.persistence.loaded` is true. For example, check that condition in the extension update hook before performing its one-time world change.

## State and data ownership

[`src/core/prepare-game-data.js`](src/core/prepare-game-data.js) calls the feature `prepare.js` functions in the original dependency order. These initialize palettes, catalogs, shared constants, scratch vectors and system exports before any world systems start. Do not call preparation again to reset a running world.

Each domain has a `state.js` exporting one shared object, such as `playerState` or `creaturesState`. Its fields are initially `undefined`; the relevant `prepare.js` assigns them. Feature functions import that object to share mutable bindings across modules. Edit a value's owning initializer, not its initial `undefined` declaration.

The domain object and a live subsystem record have different names. For example, `playerState.playerRuntime` contains the running player's controller state, while other fields on `playerState` contain movement settings, materials and scratch data. The same distinction applies to `propsRuntime`, `creaturesRuntime`, `buildingRuntime`, `hudRuntime` and `audioRuntime`.

For a new independent feature, keep its private state inside an extension. Use domain state when changing an existing subsystem that already shares that data.

## Add a feature to the frame loop

[`src/core/extensions.js`](src/core/extensions.js) accepts an object with a unique string `id` and optional `init(context)`, `afterPlayerUpdate(deltaTime, context)`, `update(deltaTime, context)` and `dispose(context)` hooks. `add()` initializes immediately and returns a removal function. `remove(id)` disposes one extension; `list()` returns registered IDs. Removing an extension during a frame prevents subsequent invocation of that removed registration.

For example, create `src/extensions/player-marker.js`:

```js
import * as THREE from "three";

export function createPlayerMarker() {
  let marker;
  return {
    id: "player-marker",
    init(context) {
      marker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.12),
        new THREE.MeshBasicMaterial({ color: 0xffd86b }),
      );
      context.scene.add(marker);
    },
    update(deltaTime, context) {
      marker.position.copy(context.player.position);
      marker.position.y += 2.4;
      marker.rotation.y += deltaTime;
    },
    dispose() {
      marker.removeFromParent();
      marker.geometry.dispose();
      marker.material.dispose();
    },
  };
}
```

Register a feature that should start with the game in [`src/extensions/index.js`](src/extensions/index.js):

```js
import { createPetTownExtension } from "../pet-town/index.js";
import { createPlayerMarker } from "./player-marker.js";

export const gameExtensions = [createPetTownExtension(), createPlayerMarker()];
```

The entry point registers that array after creating `context.extensions`. For features enabled dynamically instead, registration returns a removal function:

```js
const removeMarker = context.extensions.add(createPlayerMarker());
// Call removeMarker() when the feature is disabled.
```

Use `afterPlayerUpdate` for actor or camera changes needed by later built-in systems in the same frame. Use the late `update` hook for overlays and other presentation after the built-in systems and before rendering. Keep updates synchronous and release owned meshes, materials, event listeners and subscriptions in `dispose()`. The registry does not automatically dispose extensions on navigation or suppress hook failures. A failed initializer is unregistered and its error is rethrown. Do not dispose shared materials or geometry borrowed from existing game objects.

## Desktop integration boundary

[`src/pet-town/index.js`](src/pet-town/index.js) is the default `pet-town` extension. It creates the bridge, companion roster, controller, labels, companion panel and Mayor presentation, then exposes them as `context.petTown`. These companions are independent of `context.creatures` and the original player. Preserve the existing terrain, scenery, building and native-animal systems when extending the desktop integration.

The extension’s early `afterPlayerUpdate` hook routes the latest input, updates companion physics, and updates the following camera. The main loop refreshes the camera world matrix immediately afterward, before creature interaction, building raycasts, HUD and postprocessing updates. Its late `update` hook updates labels, the companion panel and Mayor presentation after those built-in systems. Ordinary agent colors and accessories derive from their opaque IDs; Mayor uses its own crowned appearance. The roster accepts native snapshots, removes departed agents and hides idle/unknown ordinary agents. The native broker excludes the owned Firstmate primary; Mayor comes from a separate state object. Roaming uses terrain height checks, prop and companion collisions, and the original player's fixed-step physics. It does not use a Godot navigation bake.

| Extension point                              | Contract                                                                                                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context.petTown.agents.records`             | Map of public agent IDs to live records: metadata, `root`, `body`, `character`, `world`, `position`, `head`, `facing`, `controlled`, `input`, and `appearanceLabel`. |
| `context.petTown.agents.reconcile(snapshot)` | Reconcile a versioned native snapshot; the bridge owns normal calls. Do not inject fabricated live agents.                                                           |
| `context.petTown.controller.select(id)`      | Follow an existing companion; `null` releases selection and restores the original camera.                                                                            |
| `context.petTown.controller.cycle()`         | Select the next roster member in stable ID order.                                                                                                                    |
| `context.petTown.controller.toggleControl()` | Switch the selected companion between roaming and local player input.                                                                                                |
| `context.petTown.controller.toggleView()`    | Toggle first person for the selected companion.                                                                                                                      |
| `context.petTown.controller.followMayor()`   | Follow Mayor and release manual control of it.                                                                                                                       |
| `context.petTown.bridge.action(name, args)`  | Invoke one native action and request a snapshot refresh.                                                                                                             |

[`src/pet-town/control/active-player.js`](src/pet-town/control/active-player.js) wraps `context.player` so position, head, body, mesh, velocity and camera-facing queries refer to the selected companion. This keeps building, petting and ambience near that companion. Input routing suppresses movement of the original player while following. Other player methods, including `teleport`, event subscriptions and input enablement, still belong to the original player; they are not companion commands. Use the town controller for selection and control, and the selected record's physics body for deliberate companion-specific physics changes. Do not move a companion mesh without its body.

[`src/pet-town/bridge/index.js`](src/pet-town/bridge/index.js) detects `window.__TAURI_INTERNALS__` and uses `@tauri-apps/api/core`. `get_town_snapshot` returns `{ v: 1, type: "snapshot", available, agents, mayor, mode }`; agents contain only `id`, `label`, `status` and `source`. Mayor carries public presentation fields such as `active`, `name`, `listening`, `working`, `speaking`, `speech`, `voiceStatus`, `focusSerial`, `conversationActive`, `firstmateMode` and `firstmateOwned`. Modes are `firstmate` (the visible **Standard mode**) and `live` (**Live mode**).

`town_action` accepts `invokeMayor`, `mayorTalk` with `active`, `mayorRetryVoice`, `setMayorMode` with `mode`, `openMayorSettings`, `focusAgent` with `id`, and `stopMayor`. Rust validates the calling town window and its allowed local URL in [`town_commands.rs`](../pet-town/src-tauri/src/town_commands.rs). No private focus route or credential crosses this boundary. `focusAgent` reuses the existing isolated focus helper; the renderer cannot supply an executable, session socket or arbitrary deep link.

The bridge polls every 500 ms in a visible native window, slows in the background, backs off after failures and refreshes after actions. Connection loss clears the roster and selection. Ordinary browser gameplay has no IPC connection: the panels report the desktop requirement and do not synthesize agents. Its original world systems still run.

### Herdr terminal dock

`src/pet-town/terminal/` owns the selected ordinary Herdr companion's dock, xterm screen renderer, native channel, input ownership and disposal. Opening requests control without takeover; conflict requires a separate deliberate action. Back to watching closes the controller and opens an observer. No shell or agent is created. Close suppresses reopening until selection changes. Hide/modal/photo release control; restoring those states observes passively. Native blur/navigation/exit also invalidates pending opens.

`town_terminal_open({ id, cols, rows, control, takeover, onEvent })` returns an opaque viewer token; the Tauri channel delivers tagged status and base64 ANSI frame events. `town_terminal_send({ token, command })` accepts validated input, resize, scroll, mouse and fixed live-view reset commands. `town_terminal_close({ token })` detaches only a matching owned viewer. These commands require the native town window and its allowed URL. `town_terminal/` in Rust serializes connection installation with release, validates the current session incarnation before input, and kills only its spawned Herdr CLI connection. Private executable/pane/socket/session bindings remain in the broker's `TerminalTarget`. Input has bounded buffering and uncertain sends are never replayed automatically.

Herdr's terminal session CLI emits **rendered screen blits**, not raw process output or terminal modes. xterm preserves their cells/cursor/style; it cannot reconstruct native scrollback or identify original alternate-screen/application-cursor/paste modes. History and mouse interactions use the server's explicit commands while controlled. Original grid disables short-output anchoring for full-screen tools. Passive viewers cannot command native history. Return to live uses only a reported private API socket and verifies a matching pane/zero-offset response; unavailable sockets or acknowledgments fail closed with Herdr guidance. Clipboard paste is sent as one complete bracketed operation; Herdr recognizes it and applies the original application’s paste mode server-side. A 48 KB UTF-8 limit and embedded-marker rejection prevent splitting or escaping that operation. Direct keyboard input remains buffered separately. Do not claim support for unreported modes from the local xterm buffer type.

`core/viewport.js` owns `context.viewport` and `context.resizeViewport(rightInset)`. `pet-town/dock-viewport.js` reserves at most 560px (half the window at smaller sizes), and restores the full world when the dock is hidden or disposed. Camera, renderer, postprocessing, labels and HUD projections consume this viewport. `core/input-capture.js` prevents dock-focused input from becoming movement, building, audio or Mayor shortcuts. Focus transitions clear held controls; companion picking releases terminal focus before consuming its world click.

xterm and its Fit addon are imported only by the desktop extension; the public build excludes that extension. Runtime terminal styles inherit the packaged page's nonce through a local document override, without changing the global document or weakening CSP. Exact native layout, interactive history, approvals and ownership remain user-owned acceptance checks; builds establish compilation only.

## Mayor ownership and lifecycle

[`src/pet-town/mayor/index.js`](src/pet-town/mayor/index.js) owns only the in-town controls and speech presentation. It forwards mode, invoke, talk, retry, settings and stop actions. The Rust [`town_voice.rs`](../pet-town/src-tauri/src/town_voice.rs) adapter reuses the native recording/control loop and existing orchestrator. Standard mode remains transcription → trusted Firstmate → generated speech; Live mode remains GPT-Live → the same trusted Firstmate. This extension creates neither a new agent primary nor a microphone/WebRTC owner.

The button recording owner releases on blur, hidden-document transitions and disposal; native town focus loss, navigation and close provide additional release paths. Native Control+Option retains its own ownership, so releasing the town button does not cancel a still-held global shortcut. Mode changes release the town recording before applying preferences. Mayor's active conversation pauses roaming, and a changed native `focusSerial` selects Mayor. Speech follows the actor in third person and uses a fixed layout in first person.

Keep DOM classes scoped to the companion and Mayor components, retain the original game HUD, and dispose listeners, owned models/materials and bridge polling when removing the extension. The extension registry itself does not install a navigation teardown handler.

## Launch, packaging and saves

The Vite `#town-extensions` alias selects `src/extensions/index.js` normally and
`src/public-town/index.js` in `--mode public`. Public HTML uses
`src/public-town/start.js` for loading/graphics recovery before importing the same
main game. The public extension supplies Back and Undo/Redo; public settings omit
Companion and Mayor controls. Keep this boundary at build time so the published
browser bundle does not import the native bridge. `build:public` emits
`dist-public/`; the landing build copies it to `apps/web/dist/play/`, which deploys as
`/play/` on the site. Standalone `dist/` remains a separate browser-development artifact.

[`town_process.rs`](../pet-town/src-tauri/src/town_process.rs) delegates desktop
**Open Pet Town** to `godot_bridge::open`, which launches the native Godot world.
It no longer creates a browser-town WebView. The retained browser IPC handlers
still require an authorized town window and local URL, not an ordinary browser tab.
See the [3D flow](../../docs/3d-game.md) for native launch and focus ownership.

The package is `@pet-town/three-town`. Root desktop development still owns both
Vite servers (1420 and 1422); the desktop frontend build removes stale
`apps/pet-town/dist/town` and neither builds nor copies this app's output. Vite
uses `base: "./"` for relative browser assets. Root dev/build requires Godot;
release packaging exports and deduplicates the full native world pack before
signing its game-only runtime.

[`src/persistence/storage/prepare.js`](src/persistence/storage/prepare.js) deliberately retains the `bloomvale` IndexedDB database and `bloomvale:` localStorage prefix for normal builds. Public builds use `pet-town-public` and `pet-town-public:`. UI branding and the development ready event use Pet Town; renaming the legacy keys would strand existing saves in the same context. Ordinary browsers and native WebViews have separate storage. Do not describe that compatibility as automatic browser-to-desktop save transfer or as an import of old Godot layouts. `building.saveNow()` flushes pending animated placements and returns the active save promise so Back can wait for persistence.

## Existing game integration APIs

See [live context APIs](docs/game-systems.md#existing-game-integration-apis), including the selected-companion proxy caveat.

## Add a creature or change its palette

See [species, palettes, rigs, and prefabs](docs/game-systems.md#add-a-creature-or-change-its-palette).

## Three, shader and UI assets

See [Three dependencies and nonce-aware assets](docs/game-systems.md#three-shader-and-ui-assets).

### Approved UI surfaces

See [HUD, roster, and Mayor surfaces](docs/game-systems.md#approved-ui-surfaces).

### 3D pet library

See [pet geometry, assignments, and gallery ownership](docs/game-systems.md#3d-pet-library).
