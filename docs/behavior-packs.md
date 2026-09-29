# Pet behavior packs

Each bundled 2D pet lives in `apps/pet-town/src/pets/<pet-id>/` with a `flow.json` and transparent looping APNG files. Pet Studio saves user pets under `~/.pet-town/`. Settings shows every pet's state, APNG, and on-screen action.

A pet state chooses an APNG and one of two actions:

- `idle`: keep the APNG playing while the pet stays in place.
- `walking`: keep the APNG playing while the pet travels horizontally and turns at screen edges. A visible walking state can set `speedPxPerSecond` (1–200); if omitted it uses 30 pixels per second. The pet's Gentle/Playful motion preference still adjusts this speed.

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

All ten bundled KayKit pets use `blocked.png` (a thought bubble that resolves to an exclamation), `sleep.png` (growing cyan Zs), `listen.png` (a pulsing horizontal audio waveform above the pet), and `speak.png` (an animated chat bubble) for Blocked, Completed, Listening, and Speaking respectively. Running continues to use `walk.png`. Pet Studio lets a user import different APNGs and assign each state independently. It requires at least one visible APNG for a new pet; Idle and Unknown are hidden by default.

An APNG must loop continuously, have a transparent background, contain 2–64 frames, fit a 64–1024 pixel canvas, and be no larger than 20 MB when imported through Pet Studio. The validator checks frame structure, decoding, and duration. Bundled assets are also checked by `scripts/check-apng-assets.py`.

Older saved packs using `flow` nodes remain loadable. On load, Pet Town derives one APNG and action per state; old right-click animation actions are ignored. Saving an extension writes the new mapping. The right-click menu still contains **Preferences…**.

Run `pnpm run check:flow` from the repository root to verify manifests and runtime behavior.
