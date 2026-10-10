# Island journal

Press **J** or click **Journal** for one field book covering land and water. It replaces the separate Ocean Guide; O no longer opens a panel. Water rendering, activity rules, save keys and schemas remain unchanged.

- **Experiences:** illustrated gardening, fishing, wish lanterns, shell hunting, photography, stargazing, dolphins, reef diving, kelp, wreck exploration, Pearlrest Island, passing ships and night plankton. Location hints show distance, Nearby and Best after dusk where appropriate. Existing activity controls remain here. Ships, plankton and stargazing are quiet experiences without extra completion counters. Native Godot omits the browser’s night-plankton experience because gentle physical water feedback replaces that effect.
- **Places:** land destinations with safe Visit controls; ocean destinations with Head this way controls, distance and direction. A heading closes the journal and shows the compass. Companions can follow headings, while land travel requires choosing Leave first.
- **Collection:** garden growth, fish discoveries, saved wishes, coastal shells and all land/ocean stamps. Feature a collected shell while standing at the Shell Cove shelf. Existing storage records are read directly; browser and desktop records stay separate.

The journal reads water's exploration API after initialization; all ocean data and compass/touch controls stay under `src/water/`. The shared journal lives in `src/world-expansion/activities/`, with district controls owned by Willowmere and Shellhaven.

J/Escape closes the book. H/P hands off to settings/photo. Tab stays within the visible page; arrow keys, Home and End select pages when a tab has focus. Movement, diving, building and camera controls are held while open. A fishing reminder remains available on Places and Collection during a cast, including the nibble window.

## User-owned live review

1. Open J. Inspect all three pages at normal and small window sizes, including beside a terminal dock. Use Tab and arrow keys; focus must skip hidden pages. Close with J/Escape and try H/P.
2. In Places, Visit Picnic Garden. Tend the bed in Experiences. Visit Willowmere Lake, cast and switch to Collection; use the reminder to return, reel and release. Hang a wish at Lantern Grove.
3. Find a coastal shell. Collect in Experiences, then stand at the cove shelf and Feature it in Collection. Reopen the town and verify previously saved flowers, fish, wishes and shells remain.
4. Confirm no compass appears at startup. Choose Dolphin Lagoon in Places or Experiences, swim west from Driftwood Camp and follow the compass. Dive at the reef/kelp/wreck and land on Pearlrest. Verify all ocean stamps in Collection and preserved water appearance.
5. Hold movement/dive, open and close J, switch windows, and repeat with a controlled companion/gamepad/touch device. No held input should survive closing or cancellation. Check that other modal panels hide journal, compass and Dive controls.

Build and source checks do not establish live interaction or visual acceptance.
