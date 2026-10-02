# Three.js town integration verification

## Companion roaming repair — October 1, 2026

The supplied bridge recording and native screenshot showed a companion trapped
at the bridge entrance. The previous steering reproduced sustained oscillation
in the actual generated world: small sideways movements continuously reset its
per-frame stuck counter. Roaming now chooses a connected local route, follows
waypoints, and measures displacement from a stable checkpoint. Terrain clearance
uses the physics body's footprint when approaching steps.

- Fifteen deterministic, 60-second bridge-area replays used the real terrain,
  colliders and fixed-step player physics. All continued travelling; the repaired
  runs travelled 55–68 world units and made 21–40 large direction changes. One
  previous failing replay made 952 such changes and stayed near the same point
  from 20 to 50 seconds.
- Eight physics actors shared the bridge and banks for 120 simulated seconds at
  30 updates per second. All moved 119–133 world units; the longest interval
  without 0.4 units of displacement was 3.6 seconds, including normal rest.
- Manual input, release/home reset, Mayor conversation pause, and controlled
  Mayor movement were checked through the production movement functions.
- Computer Use observed a clearly labelled diagnostic actor cross the actual
  bridge from x=-17.6 to x=-10.9, using production routing, physics and animation.
  It was separate from the native roster and did not alter the saved world.
- Lint, production build, formatting and focused independent review passed.
  Unit tests were not added or run. Changed source files are below 200 lines;
  the repository-wide line gate still reports seven unrelated desktop files.
- The native WebView reloaded the changed source, but Computer Use could not
  activate it (`noWindowsAvailable`), leaving native foreground replay pending.

Diagnostic sources and implementation notes are in ignored
`var/companion-roaming/`. These are runtime integration checks, not a claim that
every saved layout or user-created enclosure has been traversed.

## Migration verification

Migration checks on October 1, 2026 used the signed native Pet Town Debug app and
the editable Vite game at port 1422. These checks are separate from the source
reconstruction audit below.

- Settings → App → Open 3D Town opens the rendered Three.js world in a native
  window. Closing and reopening that window works.
- The native roster showed real Codex/Herdr companions and Mayor; its count
  changed as the live roster changed. Distinct colors and accessories render.
- Following, Option+A cycling, C control/release, movement, V first-person view
  and Escape were exercised. Jump input was exercised; a still image alone does
  not establish the complete jump arc.
- Original creatures remain present. Browser petting, help, building/breaking
  and undo were observed. Temporary block edits were undone.
- Browser and native photo exports produced actual HUD-free images in Downloads;
  both were opened and visually inspected.
- Standard voice passed the repaired native flow. The same owned Firstmate agent,
  pane and tab rebound to its current log; a session token was persisted and the
  reply offset advanced through a completed response. The town displayed
  Speaking during native audio playback. The user confirmed both hearing the
  reply and successfully making a new request with Start talking / Stop and send.
- The user confirmed Live connects and replies aloud after the startup repair.
  Work delegation to Firstmate remains a separate unverified check. An earlier
  native attempt stayed at Connecting for over a minute and canceled successfully.
  Startup now bounds microphone access at
  20 seconds and each offer/description operation at 15 seconds, cleans up late
  capture grants, and reports the failed stage. This passed independent lifecycle
  review and build checks.
- The world mute path now cancels queued startup fades and sets master gain to
  zero immediately. Mayor voice is unchanged and independent. Independent review
  and the game lint/build pass; audible world-mute confirmation is pending.
- Native Live-connected gameplay now permits taking control, moving and switching
  first/third-person view. Control+Option+V also toggled the view. Conversation
  idle/gaze logic no longer overrides a controlled Mayor. The native mode picker
  applied Standard and Live selections after replacing deferred Enter handling
  with native change handling. Later keyboard focus replay was limited when the
  native window was again observed in the background.
- Open in Herdr exposed a too-short focus timeout, now repaired. Computer Use
  blocked inspection of WezTerm, so the direct visible destination still needs
  human confirmation. Backend completion is not a substitute for that check.
- An arm64 release app opened the bundled game at
  `tauri://localhost/town/index.html` with both Vite servers stopped. This exposed
  a production-only CSS nonce problem; the repaired splash, HUD and roster were
  visually verified. Runtime style elements now inherit Tauri's style nonce.
- Packaged gameplay verification remains incomplete. A temporary independent
  animation-frame counter stopped while the native document reported itself
  hidden and unfocused. Computer Use could inspect its UI but could not activate
  it; a title-bar click failed with `windowNotFoundAtPosition`. No JavaScript
  error was reported. The ineffective background-throttling experiment and all
  temporary diagnostics were removed. Human foreground observation is pending.
- After restoring development, the native world resumed rendering, its clock
  advanced, and companion controls were visible. This resolves the development
  loading observation; the clean packaged app still needs a foreground replay.
- The local release smoke build was unsigned and arm64-only. Distribution
  signing, notarization, DMG and Intel validation were not performed.

Evidence and the detailed acceptance checklist are in ignored
`var/three-town-migration/verification/` and
`var/three-town-migration/implement-details/`.

# Source reconstruction verification

Verified September 30, 2026 in the Codex in-app browser on macOS, at 1280 × 720.
The app runs recovered editable source. The previous downloaded runtime was
removed from the app and is not used by development or production builds.

## Source and build

- 1,257 JavaScript source files and 76 GLSL, CSS and HTML source assets.
- Three.js 0.186.0 and official addons are normal package imports.
- `index.html` imports `src/main.js`; the user's local tab was checked and loads
  `/@vite/client` and `/src/main.js` from port 1422.
- No vendor game archive, decompression step, iframe, redirect, proxy, eval-based
  loader or reference-site connection is required. Optional Google Fonts remain.
- Vite builds 1,352 modules into disposable `dist/`, including source maps and the
  Three.js notice. It reports a bundle-size warning for the full game; build passes.
- ESLint, Prettier and production build pass. Maximum maintained JavaScript file
  length is 198 lines. The repository line gate has eleven existing failures
  outside this app; this app passes. Unit tests were not added or run.

## Observed desktop behavior

The finished production source build was exercised on a separate local origin,
port 1424, so reset verification affected only the agent-created verification
block. The user's port 1422 world was not reset.

| Check            | Observed result                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Startup          | Opening scene and transition into the interactive island                                                          |
| World generation | 247,249 vertices, 255,620 triangles, 105 terrain chunks, matching reference                                       |
| Scenery          | Reference counts match, including 175 trees, 27 props, 120 prop colliders and 22 walk rectangles                  |
| Materials        | All twelve shortcuts select their respective material names                                                       |
| Building         | A brick is placed, copied, broken with debris, restored by undo and replayed by redo                              |
| Save/reload      | Previously placed brick visibly returns after a full page reload                                                  |
| Creatures        | Petting Jellop produces hearts, animation and a response toast                                                    |
| Movement         | Walk/run input moves the player and following camera; jump input exercised                                        |
| Camera           | Drag orbit, wheel zoom and Q/E respond                                                                            |
| Sound controls   | M toggles sound; volume shortcuts change the level, retained across reload                                        |
| Photo            | P produces an actual HUD-free WebP in Downloads; file opened and visually inspected                               |
| Help/reset       | Guide opens; reset cancellation works; confirmation removes the verification brick and reports one restored block |
| Time             | Morning, midday and afternoon clock/lighting progress                                                             |
| Console          | No warning/error messages reported during the final production interaction pass                                   |

Evidence is in ignored `var/pokopia-source/browser-use-details/`, including the
world screenshot, reset result and exported photo. Reference evidence remains in
ignored `var/pokopia-replica/`. Neither folder is needed to run or build the app.

## Intentional persistence repairs

Live verification exposed an inherited bug: the reference races saved-world
restoration against a 2.5-second timer. Main-thread startup work delayed IndexedDB
callbacks, the timer won, and saved blocks disappeared. Temporary diagnostic logs
confirmed the timeout with persistence enabled and a matching terrain signature.
The source now waits for storage completion; the stored brick then returned.
Diagnostic instrumentation was removed.

Saving also keeps a synchronous fallback until the matching IndexedDB record
commits, and complete storage failure restores the dirty flag. An old commit
cannot erase a newer fallback. Reset invalidates a pending restore so old blocks
cannot reappear afterward. The save schema remains unchanged.

## Independent review and limits

Three independent perspectives reviewed recovery correctness, architecture and
integration, and regression risk. All passed with no unresolved actionable
findings. The final persistence repairs received a separate focused review.

No original authored modules, variable names, comments or source map were supplied;
file boundaries and semantic names were reconstructed. Some small numerical
intermediates retain generic names. Every possible frame and input sequence has
not been compared. Ambient randomness, animation time, saved edits, viewport,
fonts, GPU and adaptive quality affect screenshots across sessions.

Physical touchscreen/gamepad behavior, sustained gliding, pointer lock and audible
sound were not independently confirmed. A browser storage operation that never
settles can keep building input waiting for restoration; explicit storage errors
and blocked opens fall back through the existing error handling.
