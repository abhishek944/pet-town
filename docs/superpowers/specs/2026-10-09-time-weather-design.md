# Pet Town time and weather design

Date: 2026-10-09. Feature: time-weather. UI/UX session: 2026-10-09-atmosphere. Parent Grill Me session: none. This is a written design for final review; production code has not changed in this chat.

## User intent and approved decisions

Give users control over the rapidly changing day and night, and create beautiful sunny, cloudy, rainy, stormy, hail and windy atmospheres. Clicking the upper-left clock opens a dedicated section of Town settings. Keep Pet Town cozy, readable and authored; do not rearrange the world.

Eight original browser selections are verified: B1=B one clear page; B2=B balanced clock range; B3=B seven fixed moments; B4=B choose weather and keep it; B5=B cozy cinematic visuals; B6=B intensity presets and separate flash control; B7=B weather volume and thunder toggle; B8=B remember everything and resume calmly. No written modifications were submitted.

Final B9 reviews this written design, the combined mockup, compact behavior, and platform scope. Native desktop is the recommended target because it is the verified running 3D experience. If B9=C or F is selected, the public browser town receives the same feature contract through its own owners and independent persistence. B9=D adds staged native review checkpoints; F adds those checkpoints to both platforms. B9=E approves a design handoff and explicitly keeps implementation for later. B and C authorize preparing an implementation plan after written design approval. Pet Street 2D is outside this feature.

## Navigation and layout

Click the full clock card, or keyboard-activate it, to open Town settings directly at Time & weather. Show a pointer, gentle hover treatment, gear/disclosure affordance and accessible name. Ordinary settings navigation also reaches the new category. Do not route through the World page first. Closing returns focus to the clock when it was the entry point.

Preserve the selected cream/sage sidebar design, Nunito body text and Fraunces headings. Desktop reference: 1280x720 viewport, 800x600 centered shell at (240,60), 180px category column. Header and footer remain anchored; time, weather, effects and sound occupy one vertically scrolling body. Other settings categories retain their own current behavior; size adaptation can be scoped to the Time & weather category to avoid unrelated panel changes.

At 640x480, the atmosphere shell is 612x452 at (14,14). Categories become a horizontal scrolling row, body remains vertically scrollable, and close/footer stay reachable. Keep 44px interactive targets, visible focus, text labels for icons and selected state. No gameplay input passes through the panel. Existing reset confirmation remains separate.

No Apply/Save button: valid selections apply immediately and persist. Changing a preference does not rebuild the whole panel or discard scroll/focus. Reopening reflects current state. On a save failure, the running choice may remain active but display that it could not be remembered; preserve the last saved preferences.

## Time model

| Mode | Duration / fixed time |
|---|---|
| Fast running clock | 960 real seconds per full town day: 16 minutes |
| Medium running clock | 3600 real seconds per day: 1 hour |
| Slow running clock | 14400 real seconds per day: 4 hours |
| Early morning | 05:30 |
| Morning | 09:00 |
| Noon | 12:00 |
| Afternoon | 15:00 |
| Evening | 17:00 |
| Dusk | 18:30 |
| Night | 22:00 |

How time passes has Running clock / Hold a time. Running mode exposes three pace buttons with a displayed full-day duration. Held mode exposes the seven named presets with exact clock labels. The user chose presets without an exact-time slider, custom pace or device clock mode.

Changing pace preserves current sky time and day counter. Selecting a held preset stops sun/sky clock progression and sets the target time within the current town day. Resume starts running from the held moment at the remembered pace, without jumping back to a previous hidden clock. Holding time does not pause actors, pets, wind, clouds, precipitation, water animation, audio or other gameplay clocks.

The displayed clock follows the authoritative town time; no separate stale HUD clock. Sun, stars, shadows, vegetation, water, lamps, wildlife night factor, music/ambience and post atmosphere all receive the same composed daylight sample. A short visual blend may smooth a preset jump, but the selected target time is shown clearly while blending. Whole-day rollover advances the displayed day/weekday; selecting a different preset does not create a new day. Preserve compatibility with the existing Day N caption; weekday can accompany it from a stable town-calendar epoch rather than pretending it is the device date.

## Weather model

Weather is manual and stays selected until the user chooses another atmosphere. It works at any running or fixed time. No natural cycles, playlists, layered editor or saved profile menu were selected. Weather effect animation uses real elapsed seconds independently of the day pace.

The eight selectable types are Super sunny, Cloudy, Light rain, Heavy rain, Thunderstorm, Hailstorm, Windy and Mist. Super sunny means clear bright weather during daylight and a clear starry sky at night; never display a sun above the nighttime horizon. HUD captions describe the actual time/weather, such as Clear night, Heavy rain or Thunderstorm, and indicate Held when applicable.

Weather changes blend across approximately 3 real seconds, including cloud coverage, light, fog/haze, wind, particles, wetness and looped audio. Interrupting a blend starts from the current blended appearance. Wetness dries more gradually after rain than particles disappear. No weather changes physics, navigation, companion behavior, fishing rewards, economy or world geometry. No damage, flooding, dangerous player forces or persistent hail accumulation.

## Visual atmosphere contract

Use B5-B's cozy cinematic character. It is an art direction reference, not proof of native effects. Native world geometry, authored composition and materials remain the foundation. Rain, wind and lighting must live in the 3D world rather than a full-screen decorative overlay.

| Weather | Native appearance and sound |
|---|---|
| Super sunny | Clear sky, warm sun and readable highlights; sparse bright clouds if desired; gentle existing birds/breeze. Clear stars at night. |
| Cloudy | Layered soft cloud coverage, muted sunlight and softer shadow contrast; sky remains light enough to explore. |
| Light rain | Sparse fine streaks, small impacts and restrained water ripples; subtle wetness and soft rain ambience. |
| Heavy rain | Denser fine streaks, coherent slant from wind, visible ground/water impacts, damp materials and modest distance haze; steady rain sound. |
| Thunderstorm | Dark layered clouds, heavy rain, gusts, distant branching lightning with controlled brief light response; distance-delayed thunder. |
| Hailstorm | Distinct pale pellets, brief impact/bounce behavior and quiet clatter; visibly different from rain, with bounded transient particles. |
| Windy | Coherent gusts through foliage, clouds and ambient debris; directional rustle/wind; no rain unless the selected weather includes it. |
| Mist | Soft height/distance haze that preserves navigation, close companion visibility and the ocean horizon. |

Rain/hail should stop at solid shelter/roofs and not pass through interior space. Place impact particles on visible exposed surfaces or water, not arbitrarily inside geometry. Underwater views suppress above-water precipitation presentation appropriately. Camera and player movement must not leave particle boundaries, trails or obvious spawn boxes. Direction and strength agree across sky, precipitation, foliage and sound. Wind should not permanently modify authored tree transforms. Native light/wetness changes preserve the current pet visibility treatment and sharp HUD.

## Intensity, comfort and quality

Weather intensity offers Gentle, Balanced and Dramatic. It scales visual density, impact counts and gust strength while keeping weather identity. It does not change audio volume implicitly. Lightning has Off, Soft and Full independently. Off suppresses bolts and brightness flashes. Soft uses distant restrained bolts with modest world-light response; Full increases that response while preserving readable UI and avoiding repeated full-screen strobing.

Reduce weather motion suppresses lightning flashes and reduces distracting near-camera rain/debris. Effect quality offers Auto, Low, Medium and High. Auto adapts rendering cost by lowering emitter/impact detail, preserving the selected atmosphere and its readable lighting. Emitters and impacts have bounded counts; they do not grow over a long session. Density/detail controls must not claim a measured performance target before native frame-time evidence exists.

## Sound and voice

Weather volume is an additional 0–100% multiplier under World sound and World volume. Respect the existing muted state; adding the feature must not enable sound. Thunder sound is a separate toggle. Lightning Off can retain thunder if the user wants it. Thunder events retain an independent storm event timing source so visual suppression does not accidentally disable sound.

Rain, wind and hail have distinct smooth loops/impacts. Crossfade when weather changes; smooth gust modulation and event envelopes avoid clicks. Do not duplicate the existing native wind/rustle bed; compose it with weather strength. World music remains available. Mayor voice volume stays independent.

Quieter while Mayor speaks defaults On. Duck weather during the trusted native Mayor speaking state and recover smoothly afterwards; do not rely on a guessed UI label or mute the voice. Cover Standard and Live mode speech. Native end-to-end verification must include an audible weather change, world mute, thunder toggle and speech ducking.

## Defaults, persistence and errors

For a first visit without saved atmosphere: Running Medium; Morning 09:00; Super sunny; Balanced intensity; Soft lightning; reduced motion Off; quality Auto; weather volume 60%; thunder On; quieter during Mayor speech On. Keep existing World sound/volume preferences unchanged.

Remember mode, running pace, held preset, current town time/day, weather, intensity, lightning, motion, quality, weather volume, thunder and speech ducking. Restore the same state on reopening. The sky clock does not advance while the app is closed; only a running active town advances it. The held moment stays held.

Store versioned atmosphere preferences alongside native preferences without resetting sound or unrelated state. Debounce preference writes and periodically checkpoint running time; flush a final checkpoint on normal exit. On older/missing data, use valid defaults. Validate enum/range values and reject non-finite time/volume values. If a save fails, keep builds and last valid preferences intact, and show a concise remember-state error. Native and browser stores stay separate if browser parity is requested.

## Component boundaries and implementation map

- A small clock/state owner holds mode, pace, absolute town time/day and held preset, and emits normalized atmosphere snapshots. Keep real animation time independent.
- A preference adapter reads/writes the versioned atmosphere state and checkpoints time without taking over the existing sound store.
- A dedicated settings page binds to that state, emits preference requests and preserves control focus/scroll. The clock button uses existing modal ownership.
- A weather coordinator composes preset/intensity/transition state over the base daylight sample. Separate sky/lighting, precipitation/impacts/shelter, wetness/water, wind/foliage, storm/lightning and weather-audio modules.
- Existing sample.gd remains the root orchestrator. Replace its hardcoded elapsed/960 day progression with the clock owner, then distribute one composed lighting sample consistently. Avoid an ever-growing root file.
- Relevant existing files: ui/hud_chrome.gd, ui/hud.gd, ui/hud_modal.gd, ui/settings_chrome.gd, ui/settings_pages.gd; scripts/sample.gd, scripts/effects/world_effects.gd, daylight.gd, native_ambience.gd; shaders/effects/sky.gdshader; existing terrain/vegetation/water lighting and post atmosphere receivers.
- Exact new paths and state types are implementation-plan choices. Keep maintained source under 200 lines and follow current source ownership. Do not alter pet-to-agent focus/window activation for this feature.

## Validation and acceptance

1. Capture native Time & weather at the exact selected 1280x720 state and 640x480 compact state. Compare hierarchy, spacing, density, copy, fonts, border/radii, selected controls, pinned header/footer and scrolling with the selected sources. Save original and implemented screenshots and resolve mismatches.
2. Click the actual native clock and reach the category directly; keyboard activate, close/Escape and restore focus. Verify no click-through placement, digging or movement while the panel owns input.
3. Measure each running pace over a known real interval, preserve current time when switching, and hold each of the seven moments with weather animation visibly continuing. Verify all lighting/audio consumers agree and resume smoothly.
4. Observe all eight weather types in daylight and nighttime, plus roof/shelter, hillside, ocean, swimming/underwater and fast camera movement. Hail must be distinct; no streaks through roofs or UI; no unbounded accumulation.
5. Test intensity, flash Off/Soft/Full, reduced motion, quality and uninterrupted readable companions. Capture the most demanding storm/hail/wind states and compare native frame-time behavior before making performance claims.
6. Verify audible rain/wind/hail/thunder, mute/volume/flash independence and Mayor speech ducking. Browser sound controls do not prove native audio.
7. Close/reopen the real app, retain current time/day/settings, and verify no clock catch-up. Exercise invalid/older preferences and a save-failure path without harming existing builds/sound.
8. Run repository checks appropriate to changed files, parse/import/build/package checks and proportionate integration/runtime diagnostics. Source wiring or builds alone do not prove weather/native UI completion. No unit tests are requested by this user.

## Evidence and limitations

All original responses, screenshots, mockup sources, hashes, DAG and decision tree live in this session. B1 baseline is an offline render of the actual native World settings component. Live CUA clock/AX was observed, but screenshots and input targeting became inconsistent while other chats changed/rebuilt the app. B5 uses the existing 4 Oct native night render from the ocean-horizon session as an unobstructed art backdrop; it is explicitly not current runtime/weather evidence.

The Herdr prerequisite is unavailable (HERDR_ENV unset), so the parent conducted dependent interviews without launching independent agents. Monitor tools are unavailable; helper preflight and direct HTTP health were checked, without claiming Monitor verification. No unrelated processes/servers were stopped. Production files are changing in other chats; re-inspect them before any implementation.

## Self-review

No placeholder requirements remain. Conflicts are reconciled: B4's unused natural-cycle requirements are not in scope; B3 selected no exact-time slider; B8 selected automatic remember/resume with no offline advance; B1's initial example values yield to B2/B8 approved values. B9 controls platform scope, not the prior decisions. Scope is atmospheric and native-first; no additional gameplay systems or procedural asset placement are implied.
