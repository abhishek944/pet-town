# Native Pet Town UI

This folder translates the existing Three.js HTML/CSS into Godot Controls. It uses the same Nunito/Fraunces fonts, source block icons, HUD SVG artwork, and journal illustrations. Measured source references are `var/godot-world-parity/source-{welcome,start,settings-world,settings-help,journal}.png` at 1280 × 720.

The source style contracts are `hud/styles/assets/town-hud.css`, `welcome.css`, `hud/settings/settings*.css`, and `world-expansion/activities/assets/journal.css` in `apps/pet-town-3d/src/`. Welcome, hotbar, settings, journal, and library are independent native components. Dialog blur uses a canvas shader; preview models render in an isolated native SubViewport.

All dimensions are CSS-equivalent pixels. Disable project canvas scaling if the native window should preserve those pixel dimensions. The welcome layout has the source compact breakpoints; the desktop dialogs target 1280 × 720 and larger.

## Startup

`scenes/startup.tscn` draws the approved hanging wooden sign over the cream/sage waves (`loading-woodland.svg`) before constructing the world. The decorative background is used for boot/loading/failure only; the ready welcome remains over the actual world. It shows **Waking up the town…**, then hands off to the existing live-world **Click anywhere to begin** screen. Loading clicks cannot start gameplay. Project boot settings use a PNG of this same native UI and the desktop Pet Town icon, so the engine default splash is never requested.

Regenerate that PNG after changing the loading design with:

```sh
var/godot-runtime/Godot.app/Contents/MacOS/Godot --path apps/pet-town-godot-sample --script res://tools/render-boot.gd
```

The renderer creates `ui/icons/boot-welcome.png` from the native Controls at 1280×720. The boot splash preserves its aspect ratio on other screens; the actual loading and welcome Controls adapt to the viewport.

## Root integration

Existing `block_selected`, `settings_toggled`, `sound_toggled`, `photo_requested`, `set_selected`, `set_status`, `update_clock`, `set_companion_count`, and `toggle_settings` remain available.

- Call `show_welcome()` after the native world is ready. This hides the gameplay HUD, blocks player input through `settings_toggled(true)`, and shows the original wooden sign. World animation should continue. Any click or keyboard press dismisses it.
- `set_pet_prompt(name, screen_position)` takes the projected point above the creature. `clear_pet_prompt()` hides it. `pet_requested` fires when the pink prompt is clicked. Keyboard F remains owned by native gameplay.
- `show_pet_response(name, text, screen_position)` displays the actual wildlife response plus six floating source hearts. Empty response text uses the source “looks so happy!” response. `show_toast(text)` displays a transient source toast.
- `volume_changed(value)` is normalized 0–1. `set_volume(value)` updates the UI and emits it. `set_sound(enabled)` updates the HUD and emits `sound_toggled`. Settings has the actual world-volume slider.
- `world_reset_requested` fires only after the user confirms clearing placed blocks. This is distinct from legacy `reset_requested`/respawn.
- `camera_requested(first_person)` fires from the native settings camera choice.
- `update_clock(seconds)` updates the time, day/weather caption, and original day/night illustration from the same world clock. The restored clock card is192×64; camera/sound/settings cookies are40×40.

## Journal data

`set_journal_data(places, experiences, collection = [])` renders actual region state. No discoveries or completed actions are invented by the UI.

Places: `{id, name, note, visited, action?}`. `action` is an optional request identifier for “Find the way”.

Experiences: `{title, art, meta, note, actions}`. All thirteen illustrations are exported directly from source `journalArt(kind)`: `photo`, `garden`, `fish`, `stars`, `lantern`, `shell`, `dolphin`, `reef`, `kelp`, `wreck`, `island`, `ship`, and `glow`. Unknown art falls back to the original photo illustration. Regenerate with `node apps/pet-town-godot-sample/ui/export-journal-art.mjs`. Actions are `{id, label, enabled}`. `journal_action(id)` delegates each action to native gameplay. The root owns saves, discovery distances, and action availability. Collection uses the same card schema and reads saved progress. `set_journal_reminder(entry)` keeps fishing controls on Places and Collection. Refreshes preserve keyboard action focus, and arrow/Home/End navigation selects tabs.

## Asset library data

`set_asset_catalog(entries)` expects `{id, name, category, path, footprint?}` for imported native PackedScenes. It renders the actual catalog count, selectable cards, source-style native 3D preview, quarter-turn control, distance slider, placement, and undo. Preview fitting handles world-baked vertices by computing imported mesh bounds and centering the object.

`asset_place_requested(id, yaw, distance)` emits radians and world units. `asset_undo_requested` requests native undo. `set_asset_result(message)` displays success or a concrete clearance failure. The root owns placement validity, collision, save/undo state, and the catalog subset. Nearby original scenery is exposed by `set_asset_targets(entries)`: `{id, name, distance, position, replaced}`. Selecting an original target disables Add. Replace emits `asset_replace_requested(id, target, yaw)`; Restore emits `asset_restore_requested(target)`; selection and turn changes emit `asset_replace_preview_requested(id, target, yaw)` for actual clearance feedback.

## Desktop panels

`hud.gd` inherits the setter facade in `hud_data.gd`. `companion_action(id, action, payload)` delegates to the authenticated desktop owner. `set_companions(entries, selected_id)` uses the entire current roster and opaque selection. Rows retain their nodes and scrolling through status refreshes. `set_companion_labels(records, camera, selected_id, viewport_size = Vector2.ZERO)` projects source 11px, single-name clickable cream pills; each record carries `{id, label, status, head: Vector3, root?: Node3D, visible?: bool}`. Supply the actual animated head position; the UI adds the source 0.55m offset. Selection uses source green colors, names clamp at160px, and native layer1 occlusion refreshes every0.18s with the source0.4m tolerance. Modal/photo/welcome visibility follows the HUD root. Pills dispatch the same `follow` action. Following an ordinary companion shows the560×76 profile toolbar with a56×56 pet portrait. Its single Terminal button explicitly requests the existing interactive terminal, subject to ownership checks; following does not attach automatically. Action hints appear only on hover, while accessible names and keyboard focus remain available. `dock_width_changed(width)` lets the root constrain the playable viewport.

`set_pet_catalog(entries)` uses the original eight catalog definitions and exported `portraitFile`/`modelFile` assets. The gallery keeps a draft tied to the selected opaque ID, validates that ID during refresh, and delegates saving before application. Native previews render the actual source models. The default crowned Mayor portrait is the exact original `createPortrait` SVG fallback; regenerate with `node apps/pet-town-godot-sample/ui/export-mayor-portrait.mjs`. Custom Mayor pet choices use their actual catalog portrait.

`set_usage(usage, selected_reading)` receives the actual `available`, `totals`, `byAgent`, `trackedSessions`, and `measuredSessions` snapshot. Town totals expand independently; followed readings are separate. Token details use source en-US integer grouping, compact totals omit trailing zeros, and standard-credit estimates retain the source three-digit and `<0.001` formatting. Measured, partial and unavailable states retain the source explanation and standard-credit estimate.

`set_mayor(state)` renders the trusted native Mayor's Standard/Live mode, recording, connection, speech, errors and recovery actions. Nullable native fields follow the original empty-field behavior; selecting Live mode remains separate from establishing a voice connection. `set_terminal(state)` accepts connection/ownership status, errors and the authenticated `rawFrame` `{seq, full, width, height, bytes}` plus `viewGeneration`. The native cell decoder retains incremental UTF-8, the original xterm Unicode6 wide/combining rules, SGR foreground/background (ANSI/256/RGB), bold/italic/dim/inverse/blink/underline variants/strike/overline, cursor styles, screen editing, scroll margins, alternate screens and DEC line art. Menlo/Monaco glyphs retain 12.5px drawing and 20px line height. TextEdit softly wraps rows within the top-aligned output area without a horizontal scrollbar, keeping source rows/cells and meaningful styled spaces authoritative. Native wrapped glyph rectangles map painted cells, the cursor and mouse coordinates back to original server cells; offscreen rectangles are never painted or hit. Copying introduces no artificial wrap newlines. Only unused trailing default padding is omitted from the display/copy projection. Interactive resize uses native font-13 advances with reserved vertical-scrollbar width; observer views never resize the terminal. The Paper console uses dark default text on light paper; explicit ANSI/256/RGB cell colors are not remapped. Native selection and copying preserve wide/combining text. The Unicode interval data is copied from xterm6 under its adjacent MIT license; plain text/color transitions remain a compatibility fallback. The terminal panel has only Back and Open terminal above the output, and one Disconnect/Reconnect footer. Connecting, reconnect-failure and ownership notices are passive text inside the paper frame; there is no mode/grid/live/takeover toolbar. Terminal key input, clipboard paste, history scroll, resize and cell mouse down/drag/up still use the existing validated native session owner. Disconnect releases the viewer lease/input while retaining its last output; it does not stop the agent. Window focus loss retains the same read-only `paused` presentation. Reconnect is explicit, preserves the originally requested observer/interactive mode and never takes over another window. Connecting and failed reconnects retain cached output until a new full frame arrives. Detached output supports local selection/copy/scroll without sending terminal commands. Back, Leave, menus, hidden HUD and desktop-bridge disconnect still fully close the view. Open terminal keeps the existing opaque, validated native destination and does not create another process/session. `set_app_update(state)` renders source About/update phases; installation retains its explicit confirmation and native save handshake.

## Building and ocean controls

`set_build_pointer(point, state, material)` uses the source 32-pixel idle/aim/bad SVG mouse cursor and the source center-target reticle when captured. The root owns the outlined world block preview and actual terrain target.

`set_ocean_data(compass, interaction, piloting)` exposes headings only after a real request, contextual Harbor launch actions, and touch dive/helm buttons. A fourth `swimming` parameter gates Dive to swimming. Native source-style joystick/jump controls show on touch devices (or the source diagnostic `--touch` override), use the source deadzone/direction/run thresholds and release on window blur, modals or text capture. `touch_contains_point(point)` excludes their zones from camera gestures. `ocean_interact` delegates the contextual action and `ocean_helm(action, held)` delegates source helm motion. Opening a modal or focusing a terminal/text field releases and hides touch controls.

Settings, Journal and the asset library constrain their outer cards to the viewport and scroll their content. The hotbar uses the source compact twelve-slot formula. Dialog Tab focus stays within the visible panel or reset confirmation. H/J/K/Escape and photo handoffs are handled before gameplay.

## Verification boundary

Godot parser and isolated headless page-constructor checks validate startup and all native UI components. Visible parity and interaction acceptance require Computer checks in the integrated world; headless checks do not establish that. The repository’s maintained-source limit applies to every GDScript and shader here.
