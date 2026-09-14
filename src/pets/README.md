# Pet authoring guide

Each bundled pet is a self-contained behavior pack. Its folder owns both its animation files and the `flow.json` file that decides what the pet does in every Herdr state. Pet Studio packs use the same runtime format but are kept in the user's private Pet Village data folder rather than this source directory.

For the full schema and validation details, see [`docs/behavior-packs.md`](../../docs/behavior-packs.md).

## Folder layout

```text
src/pets/
  my-pet/
    flow.json
    walk.png
    work.png
```

The build discovers every `src/pets/*/flow.json` automatically. The `id` in `flow.json` must exactly match the folder name. Assets are resolved only inside that pet's folder, including optional nested directories. These source folders are compiled at build time and are never edited by Pet Studio. User packs are validated, atomically activated, and loaded through the Rust backend; arbitrary external folders are not accepted. The stable bundled pack ID also keys per-character user preferences, so repeated bundled citizens using one pack intentionally share random-cast inclusion, size, opacity, label, and motion choices. User pets currently use default presentation settings and are managed from Studio.

To add a pet:

1. Create `src/pets/<pet-id>/`.
2. Put its transparent APNG animations in that folder.
3. Add `flow.json` and define all five required states.
4. Run `./scripts/check.sh` from the repository root.
5. Rebuild both packaged applications before distributing the change.

## Minimal `flow.json`

```json
{
  "formatVersion": 1,
  "id": "my-pet",
  "packVersion": "1",
  "clips": {
    "walk-fast": {
      "asset": "walk.png",
      "durationMs": 800,
      "role": "locomotion",
      "sourceFacing": "right",
      "mirror": true
    },
    "work": {
      "asset": "work.png",
      "holdAsset": "done.png",
      "durationMs": 600,
      "role": "stationary",
      "scale": 1.2
    }
  },
  "states": {
    "idle": {
      "completion": "restart",
      "flow": { "type": "hide", "durationMs": 1000 }
    },
    "working": {
      "completion": "restart",
      "flow": {
        "type": "sequence",
        "steps": [
          {
            "type": "move",
            "clip": "walk-fast",
            "durationMs": 2400,
            "speedPxPerSecond": 30
          },
          { "type": "play", "clip": "work", "count": 2 }
        ]
      }
    },
    "blocked": {
      "completion": "restart",
      "flow": { "type": "play", "clip": "work" }
    },
    "done": {
      "completion": "hold",
      "flow": { "type": "play", "clip": "work" }
    },
    "unknown": {
      "completion": "restart",
      "flow": { "type": "wait", "durationMs": 1000 }
    }
  }
}
```

## Required states

Every pack must define exactly these states:

- `idle`
- `working`
- `blocked`
- `done`
- `unknown`

Baseline visibility is ordinary flow data, and flow execution does not special-case state names. For example, bundled pets disappear while idle only because their `idle` flow uses `hide`. The optional app-level **Hide completed pets** preference is a separate presentation override for citizens in the `done` Herdr state.

Entering a different state starts from a visible baseline. A `hide` action hides the complete citizen, including its pet, label, shadow, and clickable area. A later `play` or `move` action shows it again. A `wait` in the same flow preserves the current visibility.

## Clip names and fields

Keys inside `clips` can be any valid local name, such as `walk`, `dig`, `hammer`, or `work-fast`. They do not need to match filenames or predefined actions.

A clip name must:

- start with a lowercase letter;
- contain only lowercase letters, numbers, and hyphens;
- contain at most 64 characters;
- be unique inside that pet's `flow.json`.

Each clip supports:

- `asset`: an APNG path relative to the pet folder;
- `holdAsset`: a transparent static PNG required for clips used by visible `hold` states;
- `durationMs`: the exact duration of one APNG play cycle;
- `role`: `locomotion` or `stationary`;
- `sourceFacing`: `left` or `right`, defaulting to `right`;
- `mirror`: whether it can turn safely at screen edges, defaulting to `true`;
- `scale`: optional display scale from `0.5` through `2.5`, defaulting to `1`.

Use a `locomotion` clip only when the artwork is safe to mirror and is intended for `move`. Scaling changes screen space but keeps the APNG's intrinsic aspect ratio.

## Flow actions

- `play` displays a named clip. Optional `count` repeats its declared duration.
- `move` displays a locomotion clip and moves forward for `durationMs` at `speedPxPerSecond`.
- `wait` consumes time without changing the current clip or visibility.
- `hide` hides the complete citizen for `durationMs`.
- `sequence` runs each item in `steps` in order.
- `repeat` runs one nested `flow` a fixed number of times.
- `loop` repeats one time-consuming nested `flow` until the Herdr state changes.
- `choose` selects one weighted branch deterministically for the agent and state entry.

Example weighted choice:

```json
{
  "type": "choose",
  "choices": [
    { "weight": 3, "flow": { "type": "play", "clip": "work" } },
    { "weight": 1, "flow": { "type": "wait", "durationMs": 500 } }
  ]
}
```

`completion: "restart"` starts the state's root flow again when it finishes. `completion: "hold"` keeps the final pose and visibility without movement. The validator requires `holdAsset` for clips reachable from a visible `hold` flow, so the APNG cannot keep looping. A `loop` never reaches the completion rule and is rejected inside a `hold` state.

## Right-click actions

An optional top-level `actions` object controls the pet's right-click menu. Only entries declared here appear. Each action reuses the ordinary flow language, pauses the state flow, and resumes it when finished. A real Herdr state change cancels the action immediately.

```json
"actions": {
  "wave": {
    "label": "Wave",
    "flow": { "type": "play", "clip": "wave" }
  }
}
```

Action identifiers use lowercase letters, numbers, and hyphens. Labels are 1–24 trimmed characters. Packs may define up to eight actions. Actions must finish, so they cannot contain `loop`. Add the referenced APNG and clip in the same `flow.json`, run `./scripts/check.sh`, and rebuild.

## APNG requirements

Each clip's `asset` must be a valid APNG. It must:

- use 8-bit RGBA pixels with a genuinely transparent canvas;
- contain at least two meaningful frames;
- loop indefinitely;
- use positive frame durations whose total exactly matches `durationMs`;
- stay within a 2048 × 2048 canvas;
- contain valid PNG checksums, chunk ordering, animation sequence numbers, and frame operations;
- avoid empty frames, hidden-RGB-only changes, and imperceptible one-pixel changes.

A `holdAsset`, when present, must be a visible transparent static 8-bit RGBA PNG. The checker composites APNG disposal and blending before comparing visible output.

Use the project-local `/skill:pet-sprite-apng` workflow when creating or replacing animation artwork. It generates reviewed sprite sheets first, then assembles deterministic APNGs. For bundled sleeping assets, `--sleep-z-trail` applies the approved thick electric rising-Z treatment; the checker requires that signal in all eight frames.

## Useful limits

- Timed actions: 16–60,000 ms
- Restarting state cycle: 100–300,000 ms
- `play` and `repeat` count: 1–100
- Movement speed: 1–200 pixels per second
- Clip scale: 0.5–2.5
- Loop body: at least 100 ms
- Right-click actions: at most 8, each at most 300,000 ms

The validator also limits nesting, node counts, and choice branches so malformed packs cannot stall the renderer.

## Check your work

Run:

```bash
./scripts/check.sh
```

The checks validate the JSON schema, local asset references, flow timing, movement roles, APNG payloads, TypeScript build, Rust code, source-file line limits, and packaged binary architecture.
