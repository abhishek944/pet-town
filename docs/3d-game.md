# 3D game flow

**User goal:** Explore and build in Pet Town's Three.js world, follow live agent companions, and talk to Mayor through the desktop app.

```text
Desktop: Open 3D Town
  → local Three.js game in the native town WebView
  → scoped get_town_snapshot / town_action commands
  → Rust broker's public agent and Mayor state
  → companion roster, camera, controls and Mayor presentation
```

## Open the town

Choose **Open 3D Town** in Pet Town desktop. The app creates or focuses one native town window and enters fullscreen. Opening an existing window returns it to fullscreen even if it was manually put into windowed mode. The normal resizable window remains available through the operating system's fullscreen control. Development loads the checkout's Three.js server on `http://127.0.0.1:1422/`; the packaged app loads its bundled `town/index.html`. This is the editable game in `apps/pet-town-3d`, not a redirect to the reference website or a Godot process.

While the town window has focus, the desktop app temporarily hides the 2D strip. Switching away or closing the town restores the strip according to the existing visibility preference. Reopening the town focuses an existing window when one is present. Losing focus, navigating or closing releases a recording started by the town button.

The default development build also supports ordinary browser play. A browser has no desktop IPC connection, so its Companions and Mayor controls explain that Pet Town desktop is required. Use the desktop app's **Open 3D Town** for live agents and voice; opening that browser URL alone does not connect them.

The public landing page uses a separate `public` build at **/play/**. Its extension is selected at build time: it includes the player, native wildlife, building and photos, and excludes the agent roster, Mayor and desktop bridge. The game loads only after the visitor chooses Play. Public settings contain World and How to play; Back, Undo and Redo remain available in the HUD. Touch retains movement, jump/glide, camera drag/pinch, tap-to-place and hold-to-break gestures. Back flushes animated block placements and awaits the save before navigating, with confirmation if storage failed.

The public build writes to `pet-town-public` storage instead of the legacy desktop/development namespace. `pnpm --filter @pet-town/web build` creates the complete static site including `dist/play/`. Relative game assets and Back links preserve a configured landing-page base path. See the [public browser instructions](../apps/pet-town-3d/README.md#public-browser-town) for development commands.

## Explore and build

The reconstructed world retains its terrain, water, vegetation, buildings, player, native creatures, building tools, photos, audio and day cycle. Click the opening screen and press **H** for its guide. Use WASD or arrows to move, Shift to run, Space to jump or glide, drag to look, and the wheel to zoom. Left-click breaks a block, right-click places one, and **F** pets a nearby native creature. The guide also exposes material selection, undo/redo and the confirmed world-reset action.

World edits use IndexedDB with a localStorage fallback. The legacy `bloomvale` database and `bloomvale:` storage prefix are retained so existing saves remain compatible in the same storage context. An ordinary browser and the native WebView have separate storage; their worlds are not transferred automatically. These saves do not import the retired Godot town's layout files.

## Follow and control companions

The Rust broker remains authoritative for live agents. The town receives only opaque IDs, normalized states, safe labels and sources. Working, blocked and completed agents can appear; idle and unknown ordinary agents stay hidden. The Mayor-owned Firstmate session is excluded from the ordinary roster, and an enabled Mayor has one separate companion.

The **Companions** button shows the current count and every current companion. Choose a portrait row or click a companion in the world to follow it. The picker closes after selection; its count is the live roster size, with no ten-entry cap. Rows retain their focus and scroll position during status updates. Escape closes the picker before leaving a companion. **Option+A** cycles through the roster. Each ordinary agent receives a stable, ID-derived member of the eight woodland/storybook pets. Mayor keeps its golden explorer and crown until you explicitly choose another pet. These are procedural 3D characters, separate from Pet Studio's 2D APNG packs and the world's original animal population.

Companions roam using the game's terrain, prop collisions and player physics. They choose reachable local paths around obstacles, follow waypoints across bridges and terrain steps, and choose another path when an obstacle blocks the route or they stop making progress. **C** toggles control of the selected companion: WASD moves relative to the camera, Shift runs, and Space jumps. **V** switches between third-person and first-person views; the selected model and label hide in first person. **Escape** or **Leave** returns to the original player. Following routes movement away from the original player, and releasing control lets the companion resume roaming. Controlling a companion is a local game action; it does not send movement commands to a coding agent. Building and nearby-animal interactions use the followed companion's location.

Open **H → Companions** for the selected profile, **Control / Release control**, third-person/first-person choices, **Leave**, and **Open agent** or **Open in Herdr**. The latter action sends only the selected opaque ID to Rust. Rust recollects and revalidates the private focus route using the existing focus helper. Mayor's **Open in Herdr** targets its owned Firstmate pane.

## Choose a companion’s pet

Open **H → Companions → Change pet**. The visual library contains **Maple** the fox courier, **Clover** the rabbit gardener, **Juniper** the cat librarian, **Scout** the raccoon ranger, **Puddle** the frog, **Moss** the mushroom, **Mossback** the turtle and **Fern** the deer. Cards use the same 3D geometry as the actual companion. Choose a card for a larger preview, use **Turn around** to inspect its silhouette, and choose **Use** to apply it. **Back to companion** returns to following/control actions.

The gallery uses four columns at desktop size and a constrained scrolling body; smaller windows use two columns. The selected model, companion profile and roster portrait update together. Changing a pet keeps the companion’s name, work status, movement, controlled state and camera view. It does not rename or restart the coding agent. A changed/ended selection disables applying the draft rather than applying it to a different companion.

Pet choices are saved on this device per opaque companion ID under the normal town’s `bloomvale:companion-pets` storage key, separately from world edits and 2D APNG preferences. They survive reopening the town for the same companion ID. Browser and native WebView choices are separate; a new agent session with a new opaque ID is a new companion. Saving must succeed before the model changes. A storage error keeps the previous pet and shows a message.

All eight pets use Pip’s locomotion code: speed-based walking/running strides, knee and elbow bends, foot lift, body sway, smooth idle/air/glide/swim transitions, reaction springs, and step/paddle timing. Their joints fit their existing shapes; held objects follow their arms. Changing a pet preserves the current stride and movement blend. The companion physics and controls remain the same.

You can browse the library without a live companion, but applying requires choosing an available companion. Ordinary browser play has no native agent connection. The public website still contains only World and How to play settings.

## Watch and respond to a Herdr companion

Following an ordinary **Herdr** companion opens its existing terminal in a Honey glass dock. At 1440×900, the dock occupies the right 560 pixels and the playable world occupies the left 880. The header uses actual companion identity/status; unavailable provider or task details stay hidden. Selecting Mayor or another service does not open a fabricated terminal.

The dock requests input control without taking it from another controller. Click the terminal to type instructions or approval responses using its existing input. Terminal keys and wheel actions stay inside the dock. Clicking the world returns keyboard control to gameplay and clears held movement. **Back to watching** releases input; **Interact** requests it again. An ownership conflict offers an explicit **Take over input** action. **Open in Herdr** uses the existing focus helper.

Short output is anchored toward the bottom without reordering screen cells. **Original grid** retains the full screen placement for terminal tools. Herdr supplies rendered ANSI screen drawings, not a raw PTY stream: the dock cannot infer the original alternate-screen, application-keyboard or clipboard-paste modes. History scrolling goes through Herdr while interactive; passive observation requires **Interact** to scroll history. **Return to live output** resets the server view directly through its reported API socket; an unavailable socket or unsupported acknowledgment reports a failure with Herdr guidance. Clipboard paste, including multiple lines, is sent atomically through Herdr’s server-side paste handling. Paste is limited to 48 KB of UTF-8 and rejects embedded paste controls; larger content can use **Open in Herdr**.

Rust resolves only the current private pane/socket/session behind the opaque companion ID. It validates the session before attachment and before input. Replacing or ending that session disables input rather than silently binding another process. Connecting, disconnected, stale and ownership-conflict states remain explicit; a written input is not a promise that the agent accepted or completed a task. Uncertain delivery is never automatically resent.

Closing the dock, selecting another companion, opening H/photo/hidden UI, losing native focus, navigation and app exit release its owned CLI viewer and input control. The Herdr agent and its PTY keep running. Restoring hidden UI resumes passive observation; reconnecting after blur requires a deliberate action. The public browser build excludes this terminal and native IPC.

Live native visual and terminal verification for this feature remains pending. The selected design and exact user-owned checks are recorded under `var/herdr-terminal/implement-details/summary.md` and the visual interview's `implementation-visual-verification.md`.

## Town interface

The wooden welcome sign uses bundled fonts and leaves the live world visible while loading. The compact HUD keeps all twelve real building materials available. Open **H** for **Companions**, **World**, and **How to play** tabs. Companion actions follow the current selection; World changes only world sound, independently of Mayor voice.

H holds keyboard focus until closed and pauses game input. **H** or **Escape** closes it without leaving the followed companion or changing its camera view. Reset has its own confirmation, initially focused on **Keep my world**. Compact windows scroll the roster, settings body and long Mayor replies while keeping their actions reachable.

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

## Connection and verification boundaries

The native bridge polls the public snapshot, refreshes after actions and retries failures with backoff. Losing the connection clears the displayed companions and selection. An unavailable agent service supplies no ordinary agents; an active Mayor can still come from native Mayor state. Departed agents are removed during reconciliation. Controls display connection or action errors instead of fabricating a roster.

Native rendering and companion controls were observed, and the user confirmed a
successful Standard-mode request and audible reply after the session-binding
repair. The user also confirmed that Live connects and replies aloud. Live work
delegation, final packaged gameplay and the direct Herdr pane transition remain
under verification. See the app's
[verification record](../apps/pet-town-3d/VERIFICATION.md) for evidence and limits.

**Implementation and extension:** [Three.js app guide](../apps/pet-town-3d/README.md), [architecture and APIs](../apps/pet-town-3d/ARCHITECTURE.md), [agent connections](agent-connections.md), [focus contract](pet-focus.md), and [adapter architecture](multi-harness-adapters.md).
