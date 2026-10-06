# Pet Town — Three.js world

The editable Three.js world used by the public browser game and standalone
browser development. Desktop **Open Pet Town** launches the native Godot world;
this browser bundle is not included in the desktop installer.
It retains the terrain, water, scenery, animals, building, movement, HUD, audio
and rendering reconstructed from
[pokopia-teal.vercel.app](https://pokopia-teal.vercel.app/), the reference in
[Paulius's demonstration](https://x.com/0xpaulius/status/2105062821574914406).
The reference calls its world **Bloomvale**. Pet Town adds live desktop agent
companions and connects Mayor to the existing desktop voice runtime.

The app runs ordinary JavaScript source in `src/`. GLSL shaders, CSS and HTML
templates are source assets. Three.js and its addons are normal pinned npm
dependencies. The downloaded compiled game is not included in the app or used by
its build, and the app does not redirect to the reference website.

This is reconstructed source: the original author's module layout, variable names
and comments were not supplied with the deployed build. Game algorithms,
procedural models, materials and controls were recovered from that build, then
named and organized for maintenance. This is not the commercial Nintendo game.

## Develop

From the repository root, with Node 20.19 or newer and the declared pnpm version:

```sh
pnpm install
pnpm run dev:town
```

This starts `@pet-town/three-town` at [http://127.0.0.1:1422](http://127.0.0.1:1422).
`pnpm run dev:workshop` is a compatibility alias. For an alternate standalone port,
use `pnpm --filter @pet-town/three-town dev --port 1423`.

The standalone browser supports world gameplay and shows a desktop connection
notice for agents and Mayor. Root `pnpm run dev` still owns both frontend servers;
stop a standalone server on port 1422 before starting it. Choosing **Open Pet Town**
in the desktop app launches Godot, not this browser frontend. The retained
browser extension's native IPC bridge is not a browser-accessible broker endpoint.

The development server reads `index.html` → `src/main.js` directly. Edit source
and Vite reloads the scene. World edits persist in browser storage. Keep the same
storage context to access the same saved world.

```sh
pnpm --filter @pet-town/three-town lint
pnpm --filter @pet-town/three-town build
pnpm --filter @pet-town/three-town check
pnpm --filter @pet-town/three-town preview
```

Stop the development server before previewing on the same port. `check` runs lint
and a production build. `dist/` is disposable output with source maps; relative
asset paths allow static hosting at the root or a subdirectory. Desktop builds
remove stale `apps/pet-town/dist/town` output and do not build or copy this bundle.
Root `pnpm run build` packages Pet Street and the native Godot Pet Town runtime.
The original game's optional remote resources are Google Fonts; desktop Mayor
voice uses the existing separately configured native voice services.

## Public browser town

The landing page opens a separate solo build at `/play/`. It keeps the player,
native wildlife, building, photos and sound, and excludes the desktop agent and
Mayor extension. No account, desktop connection or voice setup is needed.

```sh
pnpm --filter @pet-town/three-town dev:public
pnpm --filter @pet-town/web dev
pnpm --filter @pet-town/web build
```

`dev:public` serves the solo source at port 1423. The web dev command builds the
solo game once and serves it at port 4173 under `/play/`; rerun
`pnpm --filter @pet-town/three-town build:public` after editing game source.
The web build includes `dist-public/` in `apps/web/dist/play/`, with relative
assets and a Back link that also work under a static-host subdirectory.
Set `VITE_BASE_PATH=/pet-town/` when building the landing page for that prefix.
`apps/web/dist` deploys to the `pet-town-web` Cloudflare Worker, and
`pnpm exec wrangler deploy --dry-run` from `apps/web` validates it without credentials.

Public saves use the `pet-town-public` IndexedDB database and localStorage prefix,
separate from the desktop/development `bloomvale` namespace. Back waits for pending
edits to save and asks before leaving if storage fails. Undo/Redo buttons are
available without a keyboard. Touch uses the existing movement stick, jump/glide,
drag/pinch camera, tap-to-place and hold-to-break controls; H includes their guide.
Reset remains a separate confirmation. The loading screen includes a Back link,
and startup/graphics failures provide recovery actions.

## Extend

Start with [ARCHITECTURE.md](./ARCHITECTURE.md). The main entry points are:

| Change                                  | Source                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| Add a feature                           | `src/extensions/index.js` and `src/core/extensions.js` |
| Desktop snapshot and actions            | `src/pet-town/bridge/`                                 |
| Live companions and appearances         | `src/pet-town/agents/`                                 |
| Follow, control and first-person camera | `src/pet-town/control/`                                |
| Companion labels and roster             | `src/pet-town/ui/`                                     |
| Mayor controls and speech presentation  | `src/pet-town/mayor/`                                  |
| Renderer defaults                       | `src/core/config.js`                                   |
| Island generation and block types       | `src/terrain/`                                         |
| Sky, day cycle and water                | `src/sky/`, `src/water/`                               |
| Trees, buildings and props              | `src/vegetation/`, `src/props/`                        |
| Original character, movement and camera | `src/player/`                                          |
| Native creature species and behavior    | `src/creatures/`                                       |
| Materials, building and undo/redo       | `src/building/`                                        |
| Original interface and controls         | `src/hud/`                                             |
| Sounds and music                        | `src/audio/`                                           |
| Effects and postprocessing              | `src/effects/`, `src/rendering/`                       |
| Local world saves                       | `src/persistence/`                                     |

Feature objects can implement `init(context)`,
`afterPlayerUpdate(deltaTime, context)`, `update(deltaTime, context)` and
`dispose(context)`. The early hook updates companion movement and camera before
creatures, building, HUD and postprocessing; the main loop refreshes the camera
world matrix immediately after it. The late `update` hook handles overlays after
the built-in systems. The default `pet-town` extension exposes `context.petTown` for
its agents, controller, bridge and presentation. Add features alongside it in
`gameExtensions`. The original terrain, animals and building APIs remain
available; native live agents are a separate roster.

## Play

Click the opening screen, then press **H** for the game guide.

| Action                               | Control                                                 |
| ------------------------------------ | ------------------------------------------------------- |
| Walk / run                           | WASD or arrows / hold Shift                             |
| Jump / glide                         | Space / hold Space                                      |
| Turn camera / zoom                   | Q or E, drag / wheel                                    |
| Place / break                        | Right / left mouse button                               |
| Choose material                      | 1 through =, or hotbar                                  |
| Cycle / copy material                | Shift + wheel / middle mouse                            |
| Undo / redo                          | Ctrl+Z / Ctrl+Shift+Z                                   |
| Pet a nearby native creature         | F                                                       |
| Save photo                           | P or camera control                                     |
| Sound / volume                       | M / [ and ]                                             |
| Mouse lock                           | L                                                       |
| Reset                                | H → Reset world → confirm                               |
| Follow a live companion              | Click it or select it in Companions                     |
| Cycle companions                     | Option+A                                                |
| Control selected companion           | C                                                       |
| First / third person while following | V                                                       |
| Leave companion                      | Escape                                                  |
| Call Mayor                           | Option+M                                                |
| Standard mode recording              | Native Control+Option, or Start talking / Stop and send |

Touch controls and gamepad handling are present in the recovered game. Companion
control routes its existing input sample to the selected actor and leaves the
original player in place. Details provide **Open agent** or **Open in Herdr**;
Rust revalidates the opaque ID before focusing the existing agent session.

The Mayor panel offers **Standard mode** and **Live mode**, native settings,
recording/status, voice retry and Live stop controls. Both modes use the existing
trusted Firstmate primary. The town supplies presentation and actions; native
code retains microphone, credential and agent-session ownership. See the
[3D flow](../../docs/3d-game.md) for the full integration contract.

World edits use IndexedDB with a localStorage fallback. The legacy `bloomvale`
database and `bloomvale:` keys remain for existing saves. Storage is local to its
browser/WebView context: an ordinary browser save does not automatically appear
in the native window, and the former Godot layout is not imported. See
[VERIFICATION.md](./VERIFICATION.md) for observed checks and limits; this guide
describes implementation rather than claiming live native verification.

## Provenance

[reference.json](./reference.json) records the captured URLs and original hashes.
The ignored `var/pokopia-replica/` and `var/pokopia-source/` workspace folders hold
reference and recovery evidence; neither is required to build or run this app.
Game-specific licensing was not supplied by the reference; recovery does not
change that provenance. [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) includes
the Three.js MIT notice and is copied into production builds.
