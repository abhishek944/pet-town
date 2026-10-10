# Pet Town game flow

**User goal:** Explore and build in Pet Town's native Godot world, follow live agent companions, and talk to Mayor through the desktop app. Three.js remains the source reference and public browser game.

```text
Desktop: Open Pet Town
  → native Godot process and exported source-world resources
  → authenticated loopback TCP snapshot / scoped action requests
  → Rust broker's public agent and Mayor state
  → companion roster, camera, controls and Mayor presentation
```

## Open Pet Town

Choose **Open Pet Town** in Pet Town desktop. The app launches or focuses its Godot process in fullscreen. Reopening sends the native window a fullscreen/focus request. Development loads `apps/pet-town-godot-sample` using the editor; release launches the architecture-specific official game-only Godot runtime, which automatically loads its world pack from `Pet Town.app/Contents/Resources/Godot.pck`. Rust supplies a fresh capability and ephemeral loopback port through child environment variables. Godot clears them from its environment after reading them and authenticates every bridge request. The town receives sanitized public snapshots and scoped actions; credentials and private focus/session routes remain in Rust.

On macOS, the native world appears as **Pet Town**, not Godot. While it is open,
it owns the Dock entry and the desktop runs as an accessory app; the menu-bar
tray and the current Dock entry both offer **Settings**, **Open Pet Town**,
**Close Pet Town**, **Show Pet Street** and **Hide Pet Street**. The tray also
retains **Quit Pet Town**. Close Pet Town closes only the 3D experience; closing
the world restores the desktop Dock entry with the same five actions. Quitting
the native world alone leaves Pet Street running; tray **Quit Pet Town** closes both processes.

While the town window has focus, the desktop app temporarily hides Pet Street. Switching away or closing the town restores Pet Street according to the existing visibility preference. Reopening the town focuses an existing window when one is present. Losing focus, navigating or closing releases a recording started by the town button.

The retained Three.js development server on `http://127.0.0.1:1422/` supports source comparisons and ordinary browser play. It has no desktop connection. Standalone Godot also works without the desktop bridge, showing unavailable companions and usage. Use the desktop app's **Open Pet Town** for live agents and voice.

The public landing page uses a separate `public` build at **/play/**. Its extension is selected at build time: it includes the player, native wildlife, building and photos, and excludes the agent roster, Mayor and desktop bridge. The game loads only after the visitor chooses Play. Public settings contain World and How to play; Back, Undo and Redo remain available in the HUD. Touch retains movement, jump/glide, camera drag/pinch, tap-to-place and hold-to-break gestures. Back flushes animated block placements and awaits the save before navigating, with confirmation if storage failed.

The public build writes to `pet-town-public` storage instead of the legacy desktop/development namespace. `pnpm --filter @pet-town/web build` creates the complete static site including `dist/play/`. Relative game assets and Back links preserve a configured landing-page base path. See the [public browser instructions](../apps/pet-town-3d/README.md#public-browser-town) for development commands.

## Explore and build

Native animals now share [gentle, mass-aware physical contact](animal-contact.md), including companions, ambient wildlife and individual marine animals. Local steering anticipates encounters, while Godot's Jolt engine resolves contact between their solid bodies.

The complete export spans X/Z −208 through 208 and includes **100% of source dry land: 27,037 cells**, with 783 terrain/lip chunks, 301 props, 432 trees and 83,623 vegetation instances before source density filtering. Source terrain, connected water masks, vegetation, buildings, explorer, wildlife, audio and day cycle are reconstructed in Godot. Click the opening screen and press **H** for its guide. Use WASD to move, Shift to run, Space to jump or glide, drag to look, and the wheel to zoom. Left-click breaks a block, right-click places one, and **F** pets nearby wildlife or uses the current ocean/boat prompt. The guide exposes twelve materials, undo/redo and world-reset confirmation.

Dirt paths sit 1 cm below the surrounding grass, including rebuilt terrain after edits. The explorer and controlled companions can land on solid furniture and authored building tops. Tables, bench seats, rotated furniture, curved roofs and exterior decks retain support after landing; thin surfaces catch descending jumps and falls. Roof support follows the rendered structural surfaces and terrain reseating. Jump height is unchanged, so taller roofs are reached from raised ground, built steps or a higher glide. Solid walls and low roof undersides still block movement.

Native edits, placed assets, journal/ocean progress, boat state, pet choices, preferences, photos and mesh caches use Godot's isolated `Pet Town Godot Sample` user directory. Browser saves remain in IndexedDB/localStorage under their existing `bloomvale` or public `pet-town-public` namespaces. Native preview voxel saves migrate at unchanged coordinates only after verifying their immutable source crop; the original save is backed up before writing the full-world signature. The two applications do not overwrite each other's saves.

Terrain previews reuse the source selected block textures, white target-face feedback, pulsing cream outline and coral denial feedback. The preview starts hidden. Selecting a building material or clicking terrain to place, break or copy a block activates its existing following behavior for ten seconds; each building action restarts that timer. Walking, camera movement and unrelated input do not extend it, so it fades away after ten seconds without a building action. The pointer centers in first person. Changes build on a worker, recheck occupancy and save before publishing geometry and collision together. Building is disabled while following a companion. The native asset library includes all **26 source designs**, with dry/level footprint and collision checks, add/replace/restore actions and shared undo history.

The source's first expansion adds **Sunmeadow**, a connected eastern district with cottages, gardens, a camp, a lookout and a sandy shore. Press **J** or choose **Journal** for Experiences, Places and Collection. Use Places to travel with the original explorer, and Experiences to plant and water a small flower bed or use the existing photo mode. Travel is disabled while following a companion; choose **Leave** first. The flower bed needs level, dry ground beneath its whole footprint. Native trail stamps and flower growth share the journal record, separately from block edits. Earlier native preview saves keep their coordinates when their source crop matches. See [world expansion and review checkpoints](world-expansion.md) and [journal controls](journal.md).

The source's second expansion adds **Willowmere**, a northern woodland lake with a walking circuit, cottage, Lantern Grove and Fernridge lookout. That expansion grew the land to 2.46 times the initial area while preserving the original village and Sunmeadow. Journal includes timed fishing with three saved fish discoveries and gentle release, and up to eight saved wish lanterns. Fish beside the lakeside rod; hang wishes between the grove posts and revisit after dusk. Both native activities check current restored terrain and save in the native journal record.

The source's final land expansion adds **Shellhaven**, a southern sandy coast with a tide pool, sea inlet, bluff lookout and driftwood camp. The complete authored world has **3.19 times the initial dry land**, preserving both districts. The native Journal offers all fifteen land destinations and a six-shell hunt: follow the hints, collect nearby shells explicitly, and see them displayed at Shell Cove. Native shell discoveries remain retained if terrain edits temporarily remove their dry support. Current full-world review must check walking, collecting, scenery and smoothness before acceptance.

## Optional Battle Mode

Press **Option + B** in ordinary town play for the native solo five-minute Battle Mode prototype. Maple automatically fires green seeds while you move, run and jump to protect wildlife from four randomly chosen skeleton appearances. Pause with Escape; focus loss also pauses until deliberate Resume. Local points/history are separate from usage coins and wildlife care. Return restores the normal town and companion context. See [Battle Mode controls and live acceptance](battle-mode.md); complete-run balance and final gameplay acceptance remain user-owned.

## Follow and control companions

The Rust broker remains authoritative for live agents. The town receives only opaque IDs, normalized states, safe labels and sources. Working, blocked and completed agents can appear; idle and unknown ordinary agents stay hidden. The Mayor-owned Firstmate session is excluded from the ordinary roster, and an enabled Mayor has one separate companion.

The **Companions** button shows the current count and every current companion. Choose a portrait row or click a companion in the world to follow it. The picker closes after selection; its count is the live roster size, with no ten-entry cap. Rows retain their focus and scroll position during status updates. Escape closes the picker before leaving a companion. **Option+A** cycles through the roster. Each ordinary agent receives a stable, ID-derived member of the eight woodland/storybook pets. Mayor keeps its original golden explorer and crown. The native scene uses exported source GLBs, portraits and baked animation clips for all eight pets plus Mayor, separately from Pet Studio's 2D APNG packs and the world's original animal population.

Companions use native terrain/prop collision and the explorer's physics when controlled. Autonomous companions start at spaced, ID-derived dry sites within 100 world units of the town start and roam within 18 units of their home. Roaming checks the full body footprint and every segment against current dry terrain, including pond and ocean margins, before collision sweeps. Actual movement is rechecked each step; a stranded companion returns to a validated site near its last safe ground, with a wider dry-site search only when needed. Releasing manual control on dry ground establishes a new local home. Supported boat passengers stay aboard rather than roaming into the sea. If no safe spawn exists, the companion stays listed and placement retries with later snapshots; choosing it explains that safe dry ground is needed rather than placing it in water. **C** toggles control of the selected companion: WASD moves relative to the camera, Shift runs, and Space jumps. **V** switches between third-person and first-person views; the selected model and label hide in first person. **Escape** or **Leave** returns to the original player. Following routes movement away from the original player, and releasing control lets the companion resume roaming. Controlling a companion is a local game action; it does not send movement commands to a coding agent. Block building is disabled while following or controlling any companion, including Mayor; leave the companion to build again. Nearby-animal interactions use the followed companion's location.

Open **H → Companions** for the selected profile, **Control / Release control**, third-person/first-person choices, **Leave**, and **Open agent** or **Open in Herdr**. The latter action sends only the selected opaque ID to Rust. Rust recollects and revalidates the private focus route using the existing focus helper. Mayor's **Open in Herdr** targets its owned Firstmate pane.

## Running usage

The bottom-left **Coin balance** card shows saved whole coins and a ring for progress toward the next coin. Initially **1,000,000 tokens = 1 coin**. Input (excluding cached), cached input and output count equally; cached input and reasoning are already included in the provider's input/output counters and are never added twice. Existing attributable recorded usage starts the balance once, and exact progress carries across sessions and restarts. Expand **+** for earned/spent metadata, token breakdowns, recorded models and separately labeled estimated standard credits. Coverage reports measured versus tracked local Codex sessions; it is not complete account-wide or all-provider usage.

Following a companion adds its coin contribution to the same compact card; that contribution is already included in the town balance. Switching companions switches the contribution, and leaving removes only that row. Herdr-hosted Codex sessions share their validated companion identity without earning duplicate coins. Other providers and Mayor show usage unavailable until supported measurements exist.

Open **H → Coins & usage** for the saved balance, fixed conversion rule, coverage and expandable **Token breakdown & sessions**. Rate editing, different token-type weights and spending are deferred. The gameplay card retains **Option+T** and the World visibility preference, hides while Settings or other modal panels are open, and clears the building controls in compact windows.

Readings refresh with the native snapshot and recover missed records after restart. New or large transcripts can take several bounded refreshes to catch up. Missing data appears as waiting or partial; known saved coins stay visible, while an unknown balance uses **—** rather than zero. These native coin controls do not change the retained browser reference or public browser build. See [Codex usage collection](agent-connections.md#codex-usage) for pricing, retention, and recovery limits.

## Choose a companion’s pet

Open **H → Companions → Change pet**. The visual library contains **Maple** the fox courier, **Clover** the rabbit gardener, **Juniper** the cat librarian, **Scout** the raccoon ranger, **Puddle** the frog, **Moss** the mushroom, **Mossback** the turtle and **Fern** the deer, plus **Knight**, **Mage**, **Barbarian**, **Rogue** and **Ranger** from KayKit’s Adventurers pack: **13 companion appearances** in total. The original player and Mayor keep their own models, and battle skeletons remain exclusive to Battle Mode. Cards use the same 3D geometry as the actual companion. Choose a card for a larger preview, use **Turn around** to inspect its silhouette, and choose **Use** to apply it. **Back to companion** returns to following/control actions.

The gallery uses four columns at desktop size and a constrained scrolling body; smaller windows use two columns. The selected model, companion profile and roster portrait update together. Changing a pet keeps the companion’s name, work status, movement, controlled state and camera view. It does not rename or restart the coding agent. A changed/ended selection disables applying the draft rather than applying it to a different companion.

Native pet choices are saved per opaque companion ID in `user://companion-pets.cfg`, separately from world edits and 2D APNG preferences. They survive reopening for the same companion ID. The source browser retains `bloomvale:companion-pets`; native choices are separate. A new agent session with a new opaque ID is a new companion. Saving must succeed before the model changes. A storage error keeps the previous pet and shows a message.

All eight original native pets use source-derived idle/walk/run/jump/glide/swim clips. The five Adventurers use KayKit’s original rigs and idle/walk/run/jump animation, plus gentle native glide/swim loops. They have individual body profiles and the same roaming, following, control and saved-choice behavior as the animal companions. Their source rigs preserve body shapes, joints and held objects. Changing a pet preserves movement state and the matching clip's playback position; native companion physics and controls remain the same.

You can browse the library without a live companion, but applying requires choosing an available companion. Ordinary browser play has no native agent connection. The public website still contains only World and How to play settings.

## Watch and respond to a Herdr companion

Following an ordinary companion opens its profile and actions in a Honey glass dock. **Open agent** or **Open in Herdr** focuses the existing coding tool. Herdr companions also offer **Observe** for passive terminal output and **Interact** to request terminal input. Selection alone does not attach a terminal or request input. Companion control, camera view and Leave remain available in the profile; Mayor keeps its separate panel. At 1440×900, the dock occupies the right 560 pixels and the playable world occupies the left 880. Its straight outer border meets the canvas without exposing the page background at rounded corners. The header uses actual companion identity/status; unavailable provider or task details stay hidden.

**Interact** requests input control without taking it from another controller. Click the terminal to type instructions or approval responses using its existing input. Terminal keys and wheel actions stay inside the dock. Clicking the world returns keyboard control to gameplay and clears held movement. **Back to watching** releases input; **Interact** requests it again. **Back to companion** releases the viewer and input and restores the profile. Switching companions starts at the profile again. An ownership conflict offers an explicit **Take over input** action. **Open in Herdr** uses the existing focus helper.

Short output is anchored toward the bottom without reordering screen cells. **Original grid** retains the full screen placement for terminal tools. Herdr supplies rendered ANSI screen drawings, not a raw PTY stream: the dock cannot infer the original alternate-screen, application-keyboard or clipboard-paste modes. History scrolling goes through Herdr while interactive; passive observation requires **Interact** to scroll history. **Return to live output** resets the server view directly through its reported API socket; an unavailable socket or unsupported acknowledgment reports a failure with Herdr guidance. Clipboard paste, including multiple lines, is sent atomically through Herdr’s server-side paste handling. Paste is limited to 48 KB of UTF-8 and rejects embedded paste controls; larger content can use **Open in Herdr**.

Rust resolves only the current private pane/socket/session behind the opaque companion ID. It validates the session before attachment and before input. Replacing or ending that session disables input rather than silently binding another process. Connecting, disconnected, stale and ownership-conflict states remain explicit; a written input is not a promise that the agent accepted or completed a task. Uncertain delivery is never automatically resent.

Closing the dock, selecting another companion, opening H/photo/hidden UI, losing native focus, navigation and app exit release its owned CLI viewer and input control. The Herdr agent and its PTY keep running. Restoring hidden UI or returning after blur does not reattach a viewer or restore input ownership; choose Observe or Interact deliberately to reconnect. The public browser build excludes this terminal and native IPC.

The native terminal's GPU fixture and nineteen cell-decoder comparisons against the source xterm implementation pass, including wide/combining text, attributes, cursor and screen editing. Native session-generation and input-release probes pass. A live user-owned Herdr terminal session remains unobserved in the final full-world build. The selected design is recorded under `var/herdr-terminal/implement-details/summary.md`; current evidence is under `var/godot-full-sync/`.

## Town interface

Native startup displays a warm paper picnic with a rabbit, duck, fox and hedgehog playing in stepped pose loops, a fixed **Pet Town** title and **Waking up the town…** cue. Terrain, vegetation and props yield during construction and audio synthesis runs in background jobs so the lightweight opening can animate. Once actual initialization finishes, the same composition immediately reveals **Let’s play →**; click to begin, or use Tab to focus the cue and Enter/controller accept. Loading blocks gameplay input and shows a recovery message if the town cannot initialize. Time & weather’s saved reduced-motion preference uses a static cast. The compact HUD keeps all twelve real building materials available. Open **H** for **Companions**, **World**, and **How to play** tabs. Companion actions follow the current selection; World changes only world sound, independently of Mayor voice. Journal, helper/profile, library, usage, terminal, Mayor and update panels are native controls using the source design and assets. Journal, live usage and companion presentation have been observed; the final panel-opening pass still requires user observation because Computer actions and screenshots are unreliable for this native window.

H holds keyboard focus until closed and pauses game input. **H** or **Escape** closes it without leaving the followed companion or changing its camera view. **Space** is reserved for the player's jump/glide/rise controls and never activates a focused UI button; use **Enter** to activate buttons with the keyboard. Text fields and an interactive terminal still accept spaces. Reset has its own confirmation, initially focused on **Keep my world**. Compact windows scroll the roster, settings body and long Mayor replies while keeping their actions reachable.

## Talk to Mayor

Mayor's panel appears only while following the Mayor companion, including while controlling it or using first-person view. Following another companion or leaving Mayor hides the panel without stopping voice. The panel displays the native name, voice mode, listening/working/speaking state, latest reply and errors. **Option+M** calls Mayor; native focus updates bring the camera to the Mayor companion. The in-town controls reuse the existing trusted Firstmate primary and native voice owners:

- **Standard mode:** hold the native global **Control+Option** shortcut to record and release to send, or use **Start talking** then **Stop and send** in town. Native recording feeds transcription, the existing Firstmate primary and generated reply speech. **Retry voice** retries the latest reply's audio.
- **Live mode:** **Start Live voice** starts the existing GPT-Live conversation, which delegates work to the same Firstmate primary. The panel distinguishes connecting, connected and errors. Stalled microphone or connection setup reports a timeout and permits retry. **Cancel connection** cancels startup; **Stop voice** ends an established conversation without closing the Firstmate pane.
- **Settings** opens the desktop Mayor settings for voice setup and trust. Changing the mode uses the existing preference path and releases a town-owned recording.

When not controlled, Mayor pauses roaming and faces the camera during a conversation. Taking control keeps movement, running, jumping and first-person view available while talking. Calling an already selected Mayor preserves control and the camera view. C, V and Escape also work while holding the Standard-mode Control+Option recording shortcut. The speech presentation follows Mayor in third person and uses a fixed position in first person. The compact card retains collapse/expand, recovery controls and a scrollable reply. H leaves voice connected and shows the card behind the dialog with its controls inert. The world speech bubble hides during dialogs; the card and bubble hide for splash, photo and hidden UI. The browser does not own the microphone, credentials or a second Firstmate session.

The top-right speaker button and **M** mute world sounds only, including music, ambience and effects. Mayor's voice is independent. Muting cancels queued world-audio fades immediately, including the initial sound-unlock fade.

The native voice runtime follows Herdr's current structured session log for the
owned Firstmate agent, pane and tab. A changed log starts at its current end so
old history is not automatically spoken. Reply acknowledgements carry a session
token, preventing an offset from an older log from skipping a current reply.
Explicit **Retry voice** can replay the latest completed reply in the current log.

## Ocean exploration

Press **J** for ocean experiences, six ocean entries in **Places**, and discoveries in **Collection**, alongside the fifteen land destinations. Source scenery and dolphin, turtle and fish models accompany native water, underwater presentation and ripples. Swim west from Driftwood Camp, dive into coral and kelp, explore the sunken sailboat, and reach Pearlrest Island. Hold **X** to dive and **Space** to rise; release both to stay at depth. Controlled companions share diving; Control+Option voice recording does not descend. Swimming shows Dive/Rise at the left edge and Build at the right; Build expands the material palette while number shortcuts and selected material persist. Returning to land restores the hotbar. Gentle entry droplets, settling rings and movement-only wakes replace the nighttime square cloud; underwater bubbles are round and depth-tested. Reduce weather & water motion suppresses travelling particles and interaction rings. **F** boards, takes/leaves the Harbor launch helm or uses the current boat prompt; WASD steers. Journal → Places shows the current launch position. Native ocean progress and boat state save separately from browser storage. The source export preserves the full connected ocean mask and all land/block coordinates. See [water exploration and live review steps](water.md).

The native world's four outer edges have invisible physics walls. Explorers and companions stop at the edge while swimming, diving or gliding and can move along it or turn back; reaching the ocean boundary never returns them to land. Below-world fall recovery and the explicit **R** return-to-start action remain available.

The water continues visually to the horizon beyond those playable edges, with the selected Clear open ocean treatment following the day/night sky. Shared water vertices and progressively coarser outer rows remove the rectangular cutoff without adding terrain, destinations or physics outside the map. Distant water projects to the horizon independently of the camera's existing town drawing distance. Boats retain their full-hull boundary checks; turn or reverse to head back.

## Connection and verification boundaries

The native bridge polls the public snapshot, refreshes after actions and retries failures with backoff. Losing the connection clears the displayed companions and selection. An unavailable agent service supplies no ordinary agents; an active Mayor can still come from native Mayor state. Departed agents are removed during reconciliation. Controls display connection or action errors instead of fabricating a roster.

Current implementation and diagnostic evidence live under
`var/godot-full-sync/implement-details/summary.md`. Full source coverage,
recursive assets, builds, packaging, source-line checks and independent review
pass. Computer checks observed full-world rendering, Journal travel, garden
progress, photos, authenticated live companions and town/selected token usage.
Runtime probes cover native physics, placement, persistence, terminal cells,
focus-state delivery and picking; Metal captures cover boat and underwater
rendering. These checks do not establish every end-to-end interaction.
Direct one-click focus and final panel opening await user observation after
Computer coordinate actions failed and screenshots became stale. Standard/Live
microphone conversations, physical touch/controller input, live Herdr terminal
interaction and final packaged interactive gameplay remain unobserved.
Earlier browser voice observations and limited-preview Godot checks remain
historical evidence, not acceptance of this full native migration. See the
[Godot guide](../apps/pet-town-godot-sample/README.md) and historical
[Three.js verification record](../apps/pet-town-3d/VERIFICATION.md).

**Implementation and extension:** [native Godot guide](../apps/pet-town-godot-sample/README.md), [Three.js/browser app guide](../apps/pet-town-3d/README.md), [source architecture and APIs](../apps/pet-town-3d/ARCHITECTURE.md), [agent connections](agent-connections.md), [focus contract](pet-focus.md), and [adapter architecture](multi-harness-adapters.md).

### Native town time and weather

Click the upper-left clock card to open **Town settings → Time & weather**. The page remembers settings on this device and resumes the same town time; there is no advance while the app is closed. The public browser town and Pet Street keep their existing behavior.

**Running clock** offers Fast (16 minutes per day), Medium (1 hour) and Slow (4 hours). Pace changes preserve the current town time. **Hold a time** applies the remembered fixed moment, with seven choices: Early morning 05:30, Morning 09:00, Noon 12:00, Afternoon 15:00, Evening 17:00, Dusk 18:30 and Night 22:00. Preset changes retain the current day number. Returning to Running resumes from that moment. Holding the sky does not pause pets, weather, water or gameplay.

Choose Super sunny, Cloudy, Light rain, Heavy rain, Thunderstorm, Hailstorm, Windy or Mist. The selection stays until changed and blends over about three real seconds. Sunny at night means a clear night sky. Rain and hail use bounded world-space pools, roof collision trajectories, surface impacts and restrained water ripples; wet surfaces dry gradually. Underwater cameras suppress precipitation.

Windy strengthens rolling waves through grass, blade flutter and canopy rustling as gusts build. Animation speed changes smoothly with wind strength, independently of the town clock. Reduced weather motion slows and softens foliage movement as well as reducing wind strength.

Gentle/Balanced/Dramatic intensity controls visual density separately from audio. Lightning Off/Soft/Full is independent of thunder sound; reduced weather motion suppresses flashes and nearby precipitation. Auto/Low/Medium/High quality bounds effect detail. Weather sound follows World mute/master volume, with its own volume and optional ducking while the trusted Mayor state reports speech. Voice remains separate. If saving fails, the panel shows a persistent message and retries while the current atmosphere stays active.
