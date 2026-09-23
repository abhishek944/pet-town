# Pet behavior packs

Each bundled 2D pet lives in `apps/pet-town/src/pets/<pet-id>/` with a `flow.json` and transparent looping APNG files. Pet Studio saves user pets under `~/.pet-town/`. Settings shows every pet's state, APNG, and on-screen action.

A pet state chooses an APNG and one of two actions:

- `idle`: keep the APNG playing while the pet stays in place.
- `walking`: keep the APNG playing while the pet travels horizontally and turns at screen edges.

Set `visible` to `false` to hide the whole pet, including its label and click target. A hidden state needs no APNG. The same APNG may be used by several states. The five agent states are `idle`, `working` (shown as Running), `blocked`, `done` (shown as Completed), and `unknown`. `listening` is an additional 2D state for the voice assistant; it does not change an ordinary agent's status.

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
    "working": { "animation": "walk", "action": "walking" },
    "blocked": { "animation": "doubt", "action": "idle" },
    "done": { "animation": "sleep", "action": "idle" },
    "unknown": { "action": "idle", "visible": false },
    "listening": { "animation": "doubt", "action": "idle" }
  }
}
```

The bundled KayKit pets currently contain only `walk.png`, so they reuse it for Blocked and Completed with the idle action until dedicated artwork is supplied. Pet Studio lets a user import different APNGs and assign each state independently. It requires at least one visible APNG for a new pet; Idle and Unknown are hidden by default.

An APNG must loop continuously, have a transparent background, contain 2–64 frames, fit a 64–1024 pixel canvas, and be no larger than 20 MB when imported through Pet Studio. The validator checks frame structure, decoding, and duration. Bundled assets are also checked by `scripts/check-apng-assets.py`.

Older saved packs using `flow` nodes remain loadable. On load, Pet Town derives one APNG and action per state; old right-click animation actions are ignored. Saving an extension writes the new mapping. The right-click menu still contains **Preferences…**.

Run `pnpm run check:flow` from the repository root to verify manifests and runtime behavior.
