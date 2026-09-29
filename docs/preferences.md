# Preferences

Open the native macOS Settings window by right-clicking any pet and choosing **Preferences…**, or run:

```bash
herdr plugin action invoke pet-town.preferences
```

Only one Settings window opens. Opening it freezes every visible pet while Herdr status polling continues in the background. Closing it resumes the village using the latest statuses.

## Per-character settings

The **Pets** section opens an **All pets** gallery showing every bundled or Pet Studio character, not just characters currently assigned to agents. Excluded characters stay visible with an **Excluded** overlay and can still be opened. Click any card to adjust that character; **All pets**, above the preview, returns to the gallery without saving or discarding edits. The gallery count and overlays reflect the current draft.

Opening Preferences from a desktop pet goes directly to that character's settings. General Settings entry and the **Pets** toolbar button open the gallery. The detail view has a character selector and a **2D agent states** list. Each row shows the state's APNG playing, its clip name, and its action. 3D settings live in the town itself, not here. Select a visible state to preview its assigned APNG and movement action. Previewing a state does not change the character's behavior or save another preference. Use **+ Add** or **Replace** on a row to choose an APNG for that state in Pet Studio. If the same character appears more than once, every copy shares these settings:

- whether the character is included in random assignment;
- its 2D animation theme (Standard or, for bundled pets, Ocean);
- pet size and opacity;
- label visibility and text size;
- Gentle, Standard, or Playful walking speed;
- stop walking while hovered.

Every bundled or newly created character is included by default. Users can deselect characters they do not want, but at least one character must remain included. Applying a draft immediately replaces any visible deselected character while preserving assignments that are still allowed. Random assignment uses each included character once before repeating characters when there are more agents than included pets.

Selecting **Ocean** in **App → 2D strip theme** switches every bundled pet to its separate Ocean rowing APNG after Apply, even if an older saved preference still says Standard for individual pets. Selecting Standard there returns all bundled pets to Standard; while App is Standard, individual bundled pets may be switched to Ocean in Pets. The per-pet selector is locked while App Ocean controls the whole strip. Only rowing art is available so far: all visible states of an Ocean pet currently share its rowing APNG, while state visibility and walking/stationary actions still come from the behavior pack. Switch back to Standard to edit state APNGs in Pet Studio. Custom pets without Ocean assets remain Standard. App Ocean also draws a full-width Living Coast beneath the pets, even if no pets are visible: wandering fish, floating lighthouses at both edges, buoys, bubbles, sparse kelp, foam and translucent rolling water. The small **Waves** controls include a live preview, **Waterline height** slider (50–146 px above the strip bottom, 88 px by default), and **Water opacity** slider (16% Glass Shallows to 36% Clear Ocean by default). Boats use a shared Ocean artwork scale, with larger default display size than Standard; the existing pet-size preference and automatic crowd shrinking still apply. They follow and lean into the exact displayed wave contour, with small paddle splashes and wakes; labels stay upright. Water and decorations never catch clicks. The Settings wave preview uses the same coast renderer; opening Settings freezes the desktop coast until it closes.

Selecting **Rainforest** in **App → 2D strip theme** adds an illustrated SVG forest along the bottom of the desktop. **Rainforest mode** chooses **After Rain** (greenery, a little creek and waterfall, and independently wandering butterflies) or **Firefly** (a dusky forest with softly glowing, independently wandering fireflies). Both modes keep the central scenery low and the decorations click-through, including when no pets are visible. Rainforest uses each pet's normal state animations, not Ocean rowing art; individual pet theme selection is locked while the app controls Rainforest. **Forest opacity** adjusts all forest decorations (including wildlife) from 0–100%, defaulting to 36% opacity / 64% transparent. Lower values reveal the apps behind the forest; 0% hides the scenery without hiding pets or labels. Both modes share this setting independently of Ocean and pet opacity. The Settings opacity preview reflects draft changes before Apply; Apply saves the mode and opacity with the other preferences. Opening Settings freezes the desktop forest and its wildlife.

Selecting **Snowy** adds the Alpine Cabin scene with **Fresh Snow** or **Aurora Night**. Both modes include gentle snowfall; Aurora Night adds warm windows and a subtle northern glow. **Snow opacity** controls scenery, snowflakes and footprints together (0–100%, default 36%) without fading pets or labels. Pets keep Standard sizing and ground alignment. Actual walking leaves alternating shoe impressions, scaled with each pet, that fade over about six seconds. Tracks are bounded to 128 marks; stationary, hidden and dragged pets leave no new tracks. Settings shows a draft mode/opacity preview; Apply saves the changes. Opening Settings or enabling Reduce Motion freezes snowfall, ambient movement and footprint aging.

The macOS **Reduce motion** accessibility setting keeps pets in place. It also freezes the coast and desktop Ocean rowing frames and levels boat pitch. Rainforest decorative motion also freezes. Standard pet sprite animations (including Rainforest pets) and the separate pet animation preview continue as before.

**Assistant** contains the Mayor dashboard: its user-defined name, Live or Standard voice mode, trusted Firstmate folder, GPT-5.6 Luna / medium default Firstmate model, local wake phrase, connection state, companion preview, and controls to save, disable, and test the phrase. Voice orchestration is disabled by default. The displayed name is independent from the opaque Pi agent ID and the Luna model name.

**App** contains a direct **Show Town / Hide Town** control, theme selection, **Start Pet Town when Herdr starts**, and an optional completed-pet timeout. Hiding the town keeps Pet Town running so it can be shown again from Settings, the menu bar, or the tray menu. **Hide completed pets** can remove sleeping completed pets after 1, 5, 15, 30, or 60 minutes. The timer begins when completion is first observed. Hidden pets remain monitored and return immediately when their status changes. Hiding is off by default, with 5 minutes selected for users who enable it. **About** shows the current version, local file location, and privacy information.

Controls edit a draft. The Settings preview reflects that draft, including walking speed. Enable **Stop walking while hovered**, then hover the preview pet to see it pause its travel while its sprite keeps animating. The frozen desktop village changes only after **Apply** succeeds. Apply validates and saves the complete draft and keeps Settings open. Closing silently discards later unapplied changes.

**Reset pet** restores only the selected character in the draft and still requires Apply. **Reset Everything…** asks for confirmation and saves defaults for the app and every character.

## Create characters and actions

Pet Studio uses APNG files supplied by the user and does not generate artwork. In Settings, choose **Create a new pet** or **Extend an existing pet**, then import transparent looping APNGs with short animation names. Pet Town validates each file and reads its cycle duration automatically.

For each state, select an APNG and either **Idle** or **Walking**. Hidden states need no APNG, and a new pet can reuse one APNG across visible states. The Pets settings page shows the saved mapping for each pet; selecting a visible state previews its APNG. Use **+ Add** or **Replace** on a state row to choose and import an APNG for that state; the existing Idle/Walking action is preserved. Pet Studio also lets extensions reuse an already-imported APNG from the mapping selector. Imported files and saved packs stay under `~/.pet-town/`.

## File location and format

Preferences are stored at:

```text
~/.pet-town/preferences.json
```

The preferences file is created after the first successful Apply or after Pet Studio activates a character with default settings. Pet Studio creates its private working folder when the application starts. A missing preferences file uses built-in defaults.

The version 3 JSON contains a schema version, a small `app` object (including non-secret orchestrator settings), and one complete entry under `pets` for every installed bundled or Pet Studio character ID. Older version 3 pet entries without `theme` remain valid and default to `standard`; older App entries without `oceanOpacityPercent` or `oceanWaterlineHeightPx` default to 36% Clear Ocean and an 88 px waterline. Older App entries without `rainforestMode` default to `after-rain`; valid modes are `after-rain` and `firefly`. Missing `rainforestOpacityPercent` defaults to 36; valid values are integers from 0–100. Missing `snowMode` defaults to `fresh-snow` (the other value is `aurora-night`), and missing `snowOpacityPercent` defaults to 36 with the same integer 0–100 range. Rainforest and Snowy are app-wide strip themes, not per-pet animation themes. It is safe to inspect and edit while Pet Town is stopped. It never contains prompts, project paths, pane or session IDs, socket paths, or agent output.

After editing the file manually, reload it with:

```bash
herdr plugin action invoke pet-town.reload-preferences
```

A reload works whether Settings is open or closed. When Settings is open, it discards the current unapplied draft. Apply rejects an older draft if a reload committed first, rather than overwriting the newer file. The app does not watch or poll the file for changes.

## Validation and recovery

Pet Town validates the whole file. Unknown fields or pet IDs, missing sections, wrong types, unsupported values, and values outside the documented control ranges are rejected.

- Invalid JSON is moved to a dated `preferences.invalid-*.json` file instead of being overwritten.
- This pre-release identity change is intentionally one-shot: older Pet Town preference schemas and former product storage paths are not migrated or aliased.
- Unsupported older schemas are preserved and rejected.
- A file from a newer unsupported schema is preserved, Apply is disabled, and Settings asks the user to update Pet Town.
- A failure before atomic replacement keeps the previous file and applied village state while leaving the draft available to correct or retry. If replacement succeeds but the final folder durability sync fails, Apply keeps memory aligned with the committed file and shows a warning.
- Preferences and safety backups remain local and survive plugin upgrades and uninstall.

Manual full cleanup is possible while Pet Town is stopped:

```bash
rm -rf ~/.pet-town
```

The next launch returns to built-in defaults. The folder is recreated when the application starts.
