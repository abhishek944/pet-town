# Native wildlife happiness

Pet Town's wildlife is separate from agent companions. Press **H**, then choose
**Wildlife** to see every species, its actual model, live population, happiness
and mood. Select a card for a larger portrait and details. The existing journal
continues to hold Experiences, Places and Collection.

Each species starts at 80/100. It loses one point every five minutes of active
play and stops at 20. Happy is 80–100, Content is 40–79, and Feeling low is 20–39.
Standing quietly in the foreground counts. Loading, menus, photos, terminal text
input, background/minimized windows and a closed game pause progress. At 100,
a species enters Feeling low after five hours and five active minutes; at 80,
after three hours and twenty-five minutes. These are gameplay minutes, independent
of the town's day/night speed.

Pet any member with **F**, the existing pet button, pointer interaction or
controller Y. Its whole species returns to 100 and its partial five-minute tick
resets. Only the touched animal gives the existing happy/hearts reaction. Wildlife
routines, flight and sleep do not change because of the meter.

**Find** prefers the nearest resting member and otherwise tracks the nearest
moving one. Settings closes and a heading and distance appear. Walk there manually;
Cancel removes the heading. Petting any member of the tracked species completes
it. Following a companion requires choosing Leave first. Find does not teleport,
walk for you, wake wildlife or make birds land. Missing targets clear or safely
retarget the same species.

A quiet reminder appears when eligible wildlife is below 40. Simultaneous species
share one reminder. There is at most one reminder every thirty active minutes,
and each species is reminded once until petted. The bar stays above the actual
material controls and avoids interaction, terminal, touch and reply controls.
It lasts twelve visible seconds, held while hovered or keyboard-focused. View
wildlife opens Settings explicitly; dismiss closes the reminder. It does not
steal focus, play a warning sound or flash.

## Ownership and saves

Native `scripts/wildlife/care_state.gd` owns species meters, partial seconds and
reminder cooldown. `care_runtime.gd` joins foreground gameplay, the pet-event
signal, Settings and the care HUD. `care_navigation.gd` owns only the selected
heading. Definitions come from `assets/wildlife-manifest.json`; counts come from
live actors. The native UI is in `ui/wildlife_*.gd` with the existing Settings
shell and fonts.

`user://wildlife-care.json` is an isolated version-one record with `species`
entries `{happiness, seconds, reminded}` and global `reminderCooldown` seconds.
Reads validate numeric types and finite values, clamp supported ranges, and
supply defaults for missing species. Unreadable or newer records are retained
and writes are blocked. Writes flush a temporary file before atomic replacement;
failures retain session progress, report once and retry periodically. Partial
progress saves every thirty active seconds, on menus/focus loss, petting and
normal close. An abrupt process kill can lose the latest thirty seconds. World
reset does not reset wildlife care. Three.js/public `/play/` parity is deferred.

## User-owned live review

Compilation and native UI fixture rendering do not establish live game acceptance.
Reload the native town from Pet Town desktop, then check:

1. Open H → Wildlife. Verify all ten species, live counts, four columns at
   1000×700, narrow-window scrolling, every portrait and detail dialog. Close a
   detail with Esc and verify focus returns to its card; keyboard and controller
   focus must remain inside the dialog while it is open.
2. Find a resting and moving species. Check the heading follows its actual
   position, Cancel clears it and no movement happens automatically. Follow an
   ordinary companion and Mayor in turn; Find must require Leave first.
3. Pet with F, the pet button, pointer and controller. The touched species must
   become 100 while other species retain their values. Hearts stay local; petting
   any member of a tracked species clears the heading.
4. Let a five-minute tick finish. Pause halfway using Settings, photo mode,
   terminal text focus and background/minimize. Resume and restart normally;
   partial progress must survive while paused time contributes nothing.
5. For a shorter low-threshold review, close the game, back up its care file and
   temporarily set chosen species to happiness 40, seconds 299, reminded false,
   with reminderCooldown 0. Open the town and begin play. Those species should
   reach 39 together and offer one prompt. Restore the backup after review.
   Use the same isolated fixture approach at 80/79 and 21/20 boundaries.
6. Dismiss and reopen the prompt's Wildlife section. Check twelve-second timeout,
   hover/focus hold, no auto-focus/sound, no repeat until petting, and the global
   thirty-active-minute cooldown across restart. Pet a prompted species while
   the reminder remains visible; it should leave the prompt immediately.
7. Check reminders/headings with terminal dock, ocean actions, contextual pet
   prompts, Mayor replies, touch controls and narrow windows. Controls should
   reflow or wait for free space without covering the material bar.

Approved references and fixture captures are preserved in
`var/wildlife-happiness/`. Final live gameplay and visual acceptance remain with
the user. No unit tests were added or run.
