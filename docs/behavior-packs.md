# Pet behavior packs

Each bundled 2D pet lives in `apps/pet-town/src/pets/<pet-id>/` with a `flow.json` and transparent looping APNG files. Pet Studio saves user pets under `~/.pet-town/`. Settings shows every pet's state, APNG, and on-screen action.

A pet state chooses an APNG and one of two actions:

- `idle`: keep the APNG playing while the pet stays in place.
- `walking`: keep the APNG playing while the pet travels horizontally and turns at screen edges. A visible walking state can set `speedPxPerSecond` (1–200); if omitted it uses 30 pixels per second. The pet's Gentle/Playful motion preference still adjusts this speed. In the live Pet Street, fresh harness output-token activity also multiplies a working pet's travel speed by 0–2.5×, smoothly changing over about half a second (1,800 tokens/minute equals the configured speed). Fresh zero stops horizontal travel; unavailable or more than six-second-old telemetry uses configured speed. This does not change APNG timing, behavior-pack data, preview speed, or idle/blocked/completed movement. Pi activity is a character-based estimate; Codex activity samples reported counters.

Set `visible` to `false` to hide the whole pet, including its label and click target. A hidden state needs no APNG. The same APNG may be used by several states. The five agent states are `idle`, `working` (shown as Running), `blocked`, `done` (shown as Completed), and `unknown`. `listening` and `speaking` are additional 2D states for the Mayor; neither changes an ordinary agent's status. Speaking takes priority while the Mayor replies, then returns to Listening (or Walking when listening is off). Existing custom Mayor packs without a speaking animation fall back to their listening animation.

## Example

```json
{
  "formatVersion": 1,
  "id": "my-pet",
  "packVersion": "1",
  "clips": {
    "walk": { "asset": "walk.png", "durationMs": 800, "role": "stationary", "mirror": true },
    "doubt": { "asset": "doubt.png", "durationMs": 900, "role": "stationary", "mirror": true },
    "sleep": { "asset": "sleep.png", "durationMs": 1200, "role": "stationary", "mirror": true }
  },
  "states": {
    "idle": { "action": "idle", "visible": false },
    "working": { "animation": "walk", "action": "walking", "speedPxPerSecond": 40 },
    "blocked": { "animation": "doubt", "action": "idle" },
    "done": { "animation": "sleep", "action": "idle" },
    "unknown": { "action": "idle", "visible": false },
    "listening": { "animation": "doubt", "action": "idle" },
    "speaking": { "animation": "doubt", "action": "idle" }
  }
}
```

The bundled roster contains ten KayKit pets and twenty restored original pets. Original packs keep their recovered Standard artwork and use the current state mappings; in Standard, Listening and Speaking reuse their Blocked animation. All original clips remain selectable in Settings. All thirty bundled pets also have five dedicated transparent Ocean WebP animations: Rowing, Blocked, Completed, Listening with a waveform, and Speaking with a chat bubble. The current app fixes the Mayor to Knight; regular agents do not enter voice states, so the other pets' Listening and Speaking artwork is available in Settings previews rather than live Mayor use. The twenty restored originals use identity-preserving wooden-rowboat artwork, six frames at 160 ms each (960 ms loops). Bundled Ocean artwork uses 384×384 canvases, resized from the 512×512 originals while preserving every frame, exact animation timing, infinite looping and sRGB metadata. Standard artwork remains unchanged. Ocean artwork is discovered separately from Standard clips; no manifest changes are needed to add these files. Custom pets without Ocean assets keep Standard artwork under the Ocean theme.

All ten bundled KayKit pets use `blocked.webp` (a thought bubble that resolves to an exclamation), `sleep.webp` (growing cyan Zs), `listen.webp` (a pulsing horizontal audio waveform above the pet), and `speak.webp` (an animated chat bubble) for Blocked, Completed, Listening, and Speaking respectively. Running continues to use `walk.webp`. Pet Studio lets a user import different APNGs and assign each state independently. It requires at least one visible APNG for a new pet; Idle and Unknown are hidden by default.

An APNG must loop continuously, have a transparent background, contain 2–64 frames, fit a 64–1024 pixel canvas, and be no larger than 20 MB when imported through Pet Studio. The validator checks frame structure, decoding, and duration. Bundled animated assets are checked by `scripts/check-pet-assets.py`.

Older saved packs using `flow` nodes remain loadable. On load, Pet Town derives one APNG and action per state; old right-click animation actions are ignored. Saving an extension writes the new mapping. The right-click menu still contains **Preferences…**.

Run `pnpm run check:flow` from the repository root to verify manifests and runtime behavior.
