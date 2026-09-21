# Preferences

Open the native macOS Settings window by right-clicking any pet and choosing **Preferences…**, or run:

```bash
herdr plugin action invoke pet-town.preferences
```

Only one Settings window opens. Opening it freezes every visible pet while Herdr status polling continues in the background. Closing it resumes the village using the latest statuses.

## Per-character settings

The **Pets** section opens an **All pets** gallery showing every bundled or Pet Studio character, not just characters currently assigned to agents. Excluded characters stay visible with an **Excluded** overlay and can still be opened. Click any card to adjust that character; **All pets**, above the preview, returns to the gallery without saving or discarding edits. The gallery count and overlays reflect the current draft.

Opening Preferences from a desktop pet goes directly to that character's settings. General Settings entry and the **Pets** toolbar button open the gallery. The detail view keeps two compact selectors: one chooses a character type such as `cat` or `viking`, and the other previews every unique APNG clip or action available to that character. Previewing an animation does not change the character's behavior or save another preference. If the same character appears more than once, every copy shares these settings:

- whether the character is included in random assignment;
- pet size and opacity;
- label visibility and text size;
- Gentle, Standard, or Playful walking speed;
- reduced movement;
- stop walking while hovered.

Every bundled or newly created character is included by default. Users can deselect characters they do not want, but at least one character must remain included. Applying a draft immediately replaces any visible deselected character while preserving assignments that are still allowed. Random assignment uses each included character once before repeating characters when there are more agents than included pets.

The macOS **Reduce motion** accessibility setting also keeps preview and desktop pets in place while their sprite animations continue.

**Assistant** contains the grouped orchestrator dashboard: its user-defined name, GPT-5.6 Luna / medium default Pi execution profile, local wake phrase, connection state, companion preview, and controls to save, disable, test the phrase, or open the ephemeral conversation. Voice orchestration is disabled by default. The displayed name is independent from the opaque Pi agent ID and the Luna model name.

**App** contains a direct **Show Town / Hide Town** control, theme selection, **Start Pet Town when Herdr starts**, and an optional completed-pet timeout. Hiding the town keeps Pet Town running so it can be shown again from Settings, the menu bar, or the tray menu. **Hide completed pets** can remove sleeping completed pets after 1, 5, 15, 30, or 60 minutes. The timer begins when completion is first observed. Hidden pets remain monitored and return immediately when their status changes. Hiding is off by default, with 5 minutes selected for users who enable it. **About** shows the current version, local file location, and privacy information.

Controls edit a draft. The Settings preview reflects that draft, including walking speed and reduced movement. Enable **Stop walking while hovered**, then hover the preview pet to see it pause its travel while its sprite keeps animating. The frozen desktop village changes only after **Apply** succeeds. Apply validates and saves the complete draft and keeps Settings open. Closing silently discards later unapplied changes.

**Reset pet** restores only the selected character in the draft and still requires Apply. **Reset Everything…** asks for confirmation and saves defaults for the app and every character.

## Create characters and actions

Pet Studio uses APNG files supplied by the user and does not generate artwork. In Settings, choose **Create a new pet** or **Extend an existing pet**, then import each transparent looping APNG with a short animation name and either the Walking or Stationary role. Pet Town validates the file and reads its cycle duration automatically.

For a new pet, assign imported animations to all six behavior slots before saving. For an extension, optionally replace existing states. To add a right-click action, enter its action ID and menu label, choose an imported animation, and select **Add menu action**. Imported files and saved packs stay under `~/.pet-town/`.

## File location and format

Preferences are stored at:

```text
~/.pet-town/preferences.json
```

The preferences file is created after the first successful Apply or after Pet Studio activates a character with default settings. Pet Studio creates its private working folder when the application starts. A missing preferences file uses built-in defaults.

The version 3 JSON contains a schema version, a small `app` object (including non-secret orchestrator settings), and one complete entry under `pets` for every installed bundled or Pet Studio character ID. It is safe to inspect and edit while Pet Town is stopped. It never contains prompts, project paths, pane or session IDs, socket paths, or agent output.

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
