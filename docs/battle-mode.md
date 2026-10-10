# Native Pet Town Battle Mode

Battle Mode is an optional solo prototype. Reopen the development desktop town to load the new native scripts, then press **Option + B** in ordinary town play to open the challenge screen. It also works in standalone Godot without live coding agents. Pet Street and public browser play keep their current behavior.

## Playing

Maple protects a fixed starting group of Nimbaa, Fiddlekit and Tuftlet in the existing village clearing. Move with WASD, run with Shift and jump with Space. Orbit and zoom use the ordinary chase camera. Maple aims and fires green seeds automatically at the nearest visible skeleton within 14 units. Visible solid scenery blocks shots. Building, travel, gliding, pet switching and ordinary companion panels are unavailable during the match.

After a three-second countdown, survive five active minutes. Minion, Warrior, Rogue and Mage appearances spawn randomly, directly on connected clear ground. They share one melee behavior: 40 health, 2.9 movement speed, a visible 0.6-second overhead windup, 10 damage and a 1.5-second attack interval. The amber ring and exclamation mark indicate attacks, not spawning. Maple's launcher deals 20 damage every 0.6 seconds. Spawn attempts gradually shorten from three seconds to one, with at most sixteen living enemies.

Maple and the three participating animals start at 100 battle health. There is one life and no healing. Wildlife wanders or flees within the arena; an animal at zero rests out of the match and contributes zero health. Losing wildlife does not end the run. Maple at zero ends it. Battle damage never enters wildlife care, friendship, world edits or coin records.

**Escape** or Pause freezes combat, projectiles, wildlife battle behavior, cooldowns, animation and active time. Switching away pauses automatically. Choose **Resume battle** deliberately. Leave requires confirmation and restores town. A battle temporarily uses a minimum logical window size of 480×520; the ordinary minimum returns afterward.

## Score and history

Completed score is `floor(10 × kills + 3 × Maple health% + 2 × average wildlife health% + 500)`. Defeat gives kill points only. Abandonment records an outcome with no score. Only completed runs contribute to the personal best. Scores are local points, independent of existing usage coins.

Results show the breakdown, save status, Play again, Return to town and History. Save failure retains the visible result with **Retry save** and does not claim a saved best. Returning restores the original actor/camera, companion presentation, wildlife and ordinary controls. External coding agents continue working; their bridge snapshots are buffered during the match and reconciled on return.

`user://battle-results.json` holds the latest twenty outcomes and versioned completed bests. Match IDs make repeated saves idempotent. Writes flush a temporary file before atomic replacement. Unreadable records are preserved with an `.unreadable-<timestamp>` suffix; if preserving the original fails, writes remain blocked. History explains the recovery issue. Native and browser save directories remain separate.

The fixed arena is `village-clearing-v1`, centered at (8, 9, 12), approximately 30 units in radius. It derives navigable space from current terrain and collision, excludes water/high roofs, and validates fixed start/animal positions. Unsafe edits disable Start with an explanation; the mode never repairs or rearranges the town. Preparation yields across frames and can be cancelled with Back or Escape. Navigation is cached against committed world collision revisions, while fixed start and animal positions are rechecked before every match. Already queued terrain changes must finish before entry. Temporary animals remain frozen during cast preparation. Containment uses layer 8, separate from scenery/shot/camera queries. All ordinary body layers and save keys remain compatible.

## Ownership and assets

- `scripts/battle/session.gd`: authoritative lifecycle, pause, finalization and input restrictions.
- `arena.gd`, `boundary.gd`: supported connected paths, fair spawning and physical containment.
- `context.gd`: reversible town/camera/body/care/bridge isolation.
- `avatar.gd`, `enemy.gd`, `wildlife.gd`, `weapon.gd`: shared force-driven physics, health, animations and swept projectiles.
- `store.gd`: isolated schema validation, atomic persistence, history and versioned bests.
- `ui/battle/`: selected corner HUD, full entry/result/history, centered pause and error/recovery states.
- `assets/battle/`: recovered licensed skeleton rigs and selected seed launcher, with asset provenance.

The three integration hooks are in native `sample.gd`, `town_input.gd` and `actor_motion.gd`. No pet-to-agent focus helper, native activation route, Rust bridge protocol or browser code changed.

The asset grip/aim and combat animation remain prototype work to assess in actual play.

## User-owned live acceptance

Build/import and an isolated short native smoke/render establish integration, not a complete or balanced game. Reopen through the development desktop's **Open Pet Town**, or use `sh apps/pet-town-godot-sample/tools/run.sh` for standalone play. An already installed release must be rebuilt/reinstalled to include changed resources.

1. Enter Battle Mode without an agent. Verify the full entry screen, three-second countdown, health/timer/kills/wildlife corners, automatic seeds, all four skeleton appearances and overhead attack warning. Move/run/jump, orbit/zoom, shoot near cover, and check the muzzle and supporting arm while moving.
2. Protect wildlife and observe hits, brief hit protection, fleeing, knockout, enemy hit/fall/clear and one kill per defeated skeleton. Press R/J/K/H/V/F and building controls; none should escape the match. Check terrain, water, roof and crowded boundary containment.
3. Pause during a jump, a seed flight and an enemy windup. Wait, resume, and verify the timer, positions, momentum, cooldowns and health continue together. Switch apps and return; the match must stay paused until Resume.
4. Complete a full five-minute run, then separately lose Maple's life. Check completed/defeated breakdowns and no damage after results. Play again and verify fresh health, enemies, timer and match ID. Leave a paused match and confirm its history has no score or best update.
5. Begin while following a companion, leave after more than fifteen seconds, and check the same still-live companion/camera returns. End that agent or disconnect/reconnect during a run; Maple must remain independent, and return must reconcile the current roster safely. Confirm care and world saves did not acquire combat changes.
6. Reopen the app and check latest history and completed best. For a user-owned storage failure exercise, back up the isolated battle file. With the app closed, confirm there is no existing `battle-results.json.tmp`, then create an empty directory with that exact name beside the battle file to block only its temporary write. Finish a run, remove that empty directory, and choose Retry save. Verify one record and no false saved-best status. Never change world/care records or their directory permissions for this check.
7. Resize to ordinary and minimum windows. Check keyboard/controller button focus, text, countdown, pause, history scrolling, no overlaps, and readability at sixteen enemies. Assess animation, camera and frame smoothness. The source review and brief smoke cannot establish these full acceptance results.

No unit tests were added or run. Companion teams, upgrades, bosses, coins, multiplayer, extra arenas and browser parity remain outside this prototype.
