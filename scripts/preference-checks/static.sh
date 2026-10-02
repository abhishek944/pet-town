pref_line=$(grep -n 'await installVillagePreferences' src/main.ts | cut -d: -f1)
ready_line=$(grep -n 'renderer_ready' src/main.ts | cut -d: -f1)
poll_line=$(grep -n 'void poll' src/main.ts | cut -d: -f1)
[ -n "$pref_line" ] && [ -n "$ready_line" ] && [ -n "$poll_line" ] || exit 1
[ "$pref_line" -lt "$ready_line" ] || exit 1
[ "$pref_line" -lt "$poll_line" ] || exit 1

grep -q 'id = "preferences"' "$ROOT/herdr-plugin.toml"
grep -q 'id = "reload-preferences"' "$ROOT/herdr-plugin.toml"
grep -q 'command = \["sh", "scripts/supervisor.sh", "startup"\]' "$ROOT/herdr-plugin.toml"
grep -q 'Preferences…' src/pet-interactions.ts
grep -q 'Unapplied changes' settings.html
grep -q '>Pet</span>' settings.html
[ "$(grep -o '<button[^>]*data-tab=' settings.html | wc -l | tr -d ' ')" = 6 ]
[ "$(grep -o 'class="toolbar-glyph"' settings.html | wc -l | tr -d ' ')" = 6 ]
grep -q '<svg viewBox="0 0 24 24" focusable="false">' settings.html
grep -q 'getElementById("preview")!.hidden = !detail' src/settings-navigation.ts
grep -q 'getElementById("preview-selectors")!.hidden = !detail' src/settings-navigation.ts
if grep -q 'freezePetFrame' src/settings.ts src/settings/*.ts; then
  echo "system Reduce Motion still freezes the preview sprite" >&2
  exit 1
fi
grep -q 'preview.dataset.pauseOnHover' src/settings/pet-preview.ts
[ "$(grep -o 'class="switch"[^>]*role="switch"' settings.html | wc -l | tr -d ' ')" = 4 ]
grep -q 'bindSwitch("pause-hover"' src/settings/pet-controls.ts
grep -q 'bindSwitch("include-random-cast"' src/settings/pet-controls.ts
grep -q 'bindSwitch("hide-completed-pets"' src/settings/app-controls.ts
grep -q 'completed-hide-delay' src/settings/app-controls.ts
grep -q 'invoke<boolean>("is_settings_open")' src/village-preferences.ts
grep -q 'SettingsStartupBuffer' src/settings/start.ts
grep -q 'next.revision < this.snapshot.revision' src/settings/draft.ts
grep -A1 'draft: submitted,' src/settings/draft.ts | grep -q 'expectedRevision'
grep -q 'mergeAppliedDraft' src/settings/draft.ts
grep -q 'generation === this.applyGeneration' src/settings/draft.ts
grep -q 'this.applying || !changed' src/settings/draft.ts
grep -Fq 'byId<HTMLButtonElement>("reset-all").disabled = this.applying' src/settings/draft.ts
grep -q 'village.dispatchEvent(new Event("village-pause"))' src/main.ts
grep -q 'settingsMessage' src/settings/draft.ts
grep -q 'hide-completed-pets.*disabled = snapshot.readOnly' src/settings-choice-controls.ts
grep -q 'setSettingsReadOnly' src/settings-choice-controls.ts
grep -q 'class="settings-loading"' settings.html
grep -q 'classList.remove("settings-loading")' src/settings/start.ts
grep -q 'await invoke("show_settings")' src/settings/start.ts
grep -q 'settings_window::show_settings' src-tauri/src/lib.rs
grep -A14 'WebviewWindowBuilder::new' src-tauri/src/settings_window.rs | grep -q '\.visible(false)'
if grep -q '\.on_page_load' src-tauri/src/lib.rs; then
  echo "native window still shows before initialization" >&2
  exit 1
fi
if grep -A30 'pub(crate) fn configure_window' src-tauri/src/window.rs | grep -Eq 'orderFrontRegardless|window\.show'; then
  echo "village configure still shows before initialization" >&2
  exit 1
fi
grep -q 'session.ready' src-tauri/src/settings_window.rs
[ ! -e src-tauri/src/preferences_migration.rs ]
grep -q 'pub const SCHEMA_VERSION: u32 = 3' src-tauri/src/preferences_model.rs
grep -q 'state.read_only = protect_source' src-tauri/src/preferences.rs
if grep -A20 'window.emit("settings-selection"' src-tauri/src/settings_window.rs | head -20 | grep -q 'to_string())?'; then
  echo "Settings event error bypasses cleanup" >&2
  exit 1
fi
grep -q '<option value="60">60 minutes</option>' settings.html
grep -q 'arm_readiness_timeout' src-tauri/src/settings_window.rs
grep -q 'window.hide().is_ok()' src-tauri/src/settings_window_lifecycle.rs
grep -q 'settings_window::is_settings_open' src-tauri/src/lib.rs
grep -A3 -q '^:root\[data-theme="light"\] \.row small {' src/settings.css
grep -A3 '^:root\[data-theme="light"\] \.row small {' src/settings.css | grep -q 'color: #50535a;'
grep -A4 '^:root\[data-theme="light"\] code {' src/settings.css | grep -q 'background: #0000000a;'
grep -A4 '^:root\[data-theme="light"\] code {' src/settings.css | grep -q 'color: #35373d;'
grep -q ':root:not(\[data-theme="dark"\]) \.secondary' src/settings.css
grep -q 'bindSwitch("open-with-herdr"' src/settings/app-controls.ts
[ "$(grep -o 'type="checkbox"' settings.html | wc -l | tr -d ' ')" = 1 ]
grep -q 'id="studio-assign-orchestrator" type="checkbox"' settings.html
grep -A1 'this.selectedAnimationId = selectedPreviewAnimationId(' src/settings/pet-preview.ts | grep -q 'this.animationOptions'
grep -q 'id="pet-state-map"' settings.html
grep -q 'id="studio-operation-status".*aria-live="polite"' settings.html
grep -q 'id="studio-import-animation".*accept="image/png,image/apng' settings.html
grep -q 'Its frame timing is read from the file automatically' settings.html
grep -Fq 'this.importApng(event, this.animationId(), "stationary")' src/settings-studio.ts
grep -q 'operation: "import-animation"' src/settings-studio-progress.ts
grep -q 'setBusy(true, "import-animation")' src/settings-studio.ts
grep -q 'AnimationDraft {' src-tauri/src/pet_studio/draft_commands.rs
grep -q 'pub fn validate_import' src-tauri/src/pet_studio/apng.rs
grep -q 'The APNG must loop continuously' src-tauri/src/pet_studio/apng.rs
grep -q 'apng::validate_import' src-tauri/src/pet_studio/draft_commands.rs
grep -q '^inherit_openai_key() {' "$ROOT/scripts/supervisor/processes.sh"
grep -Fq '/bin/launchctl getenv OPENAI_API_KEY' "$ROOT/scripts/supervisor/processes.sh"
[ ! -e scripts/pet-studio-image-worker.mjs ]
[ ! -e src/settings-studio-status.ts ]
[ ! -e src/settings-studio-candidate.ts ]
[ ! -e src/settings-studio-frames.ts ]
[ ! -e src-tauri/src/pet_studio/generation_commands.rs ]
[ ! -e src-tauri/src/pet_studio/animation_generation.rs ]
if grep -Eq 'studio-(reference|generate-animation|create-animation|approve-animation|discard-animation|sheet-loading|frame-preview)' settings.html; then
  echo "Pet Studio generation controls or copy remain" >&2
  exit 1
fi
if grep -Eq 'generate_pet_|assemble_pet_animation|pet_studio_status|set_pet_reference' src-tauri/src/lib.rs; then
  echo "Pet Studio generation commands remain registered" >&2
  exit 1
fi
grep -q 'data-locomotion="true"' src/settings.css
grep -q 'calc(-50% - 24px)' src/settings.css
grep -q 'data-pause-on-hover="true"' src/settings.css
grep -A5 '^@media (prefers-reduced-motion: reduce) {' src/settings.css | grep -q 'data-locomotion="true"'
grep -A5 '^@media (prefers-reduced-motion: reduce) {' src/settings.css | grep -q 'animation: none;'
grep -q 'motion.behavior.advance(elapsedMs + motion.pendingElapsedMs' src/renderer.ts
grep -q 'render(true)' src/main.ts
grep -q 'const distance = travelDistanceFor(' src/renderer.ts
grep -q 'renderer.setSystemReducedMotion(systemReducedMotion.matches)' src/main.ts
if grep -q 'behavior.advance(effectiveElapsed' src/renderer.ts; then
  echo "walking preferences still alter behavior timing" >&2
  exit 1
fi
grep -q 'settings-layout:not(\[data-tab="pet"\])' src/settings.css
grep -q 'Also start with Herdr' settings.html
grep -q 'Optional when you use Herdr alongside the standalone app.' settings.html
if grep -qE '>Editing<|Village paused|data-tab="motion"|>Open with Herdr<|<h1>Pet</h1>' settings.html; then
  echo "obsolete Settings chrome or copy remains" >&2
  exit 1
fi
grep -A2 '^\.pet-freeze {' src/styles.css | grep -q 'pointer-events: none;'
grep -A5 '^\.pet-stack > \.pet-freeze {' src/styles.css | grep -q 'position: absolute;'
grep -A5 '^\.pet-stack > \.pet-freeze {' src/styles.css | grep -q 'bottom: 0;'
grep -A5 '^\.pet-stack > \.pet-freeze {' src/styles.css | grep -q 'translate: -50% 0;'

cargo build --quiet --manifest-path src-tauri/Cargo.toml
BINARY=src-tauri/target/debug/pet-town
HOME="$TMP/missing-home" "$BINARY" --startup-enabled
[ ! -e "$TMP/missing-home/.pet-town" ]
mkdir -p "$TMP/disabled-home/.pet-town"
python3 "$ROOT/scripts/preference-checks/disabled-preferences.py" "$TMP/disabled-home/.pet-town/preferences.json"
if HOME="$TMP/disabled-home" "$BINARY" --startup-enabled; then
  echo "disabled startup preference was ignored" >&2
  exit 1
fi
echo "preference storage and startup checks: pass"
