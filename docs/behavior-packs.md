# Behavior pack format

Behavior packs are data, not scripts. Each bundled pet owns one folder under `src/pets/<pet-id>/`. The folder contains `flow.json` and every APNG asset referenced by that file. During the build, each folder is discovered, validated as a complete unit, and compiled into immutable data before an agent can use it.

Only these five top-level state keys are allowed and required:

- `idle`
- `working`
- `blocked`
- `done`
- `unknown`

A repeated poll with the same normalized state keeps the current flow position. A different state cancels the old flow or user-requested action immediately while preserving screen position and facing, then evaluates the new flow from a visible baseline. Baseline visibility is flow-authored: flow execution treats no state name specially. Separately, the app-level **Hide completed pets** preference may hide a citizen whose Herdr state is `done` after the selected delay.

The `blocked` state is also the permission-approval animation slot. In an interactive Pi TUI with the Herdr integration loaded, the global permission-gate extension emits `herdr:blocked` with `{ active: true, label }` before displaying a Yes/No dialog and emits the matching `{ active: false, label }` when the dialog settles or is cancelled. The Herdr integration counts these open/close pairs so overlapping waits stay blocked until every wait closes. Pet Village then runs that pet's `states.blocked` flow while approval is pending. Print and JSON modes reject confirmation-covered commands without prompting. RPC mode can request confirmation and wait for its response, but the TUI-only Herdr integration does not report that RPC wait as a pet state. A pet can therefore reference a dedicated approval APNG from its blocked flow; packs that already define `blocked` remain compatible without changes.

A pack may also define an optional top-level `actions` object. Each entry supplies a short menu `label` and a finite `flow`. Only declared actions appear when the user right-clicks that pet. Actions use the same safe flow nodes as states, pause the current state flow, and resume it at the same point when complete.

Pet Studio can extend an existing bundled or user pet without modifying its original pack. It stores validated APNG clips and optional state or action replacements as a private, versioned overlay under `~/.pet-village/pet-packs/extensions/<pet-id>/`. Activation switches an `active` version pointer only after every file and hash is written. At load time, the overlay is merged onto the original manifest and the complete result passes through the normal behavior-pack compiler. Choosing **Keep existing behavior** preserves that state's currently installed flow, including any earlier extension; restoring the bundled base flow is not currently offered.

Pet Studio packs may define `orchestratorAnimations` with exactly `walking` and `listening` clip IDs. Walking is used whenever the named orchestrator is not hearing user speech; Listening is used only while its local microphone meter reports user speech. Both entries must reference reviewed, pack-local APNG clips. Pet Village adds no rings, halos, glows, or generated effects.

## Add a pet

1. Create `src/pets/my-pet/`.
2. Add transparent APNG assets such as `walk.png` and `work.png` inside that folder.
3. Add `src/pets/my-pet/flow.json` with an `id` matching the folder name.
4. Reference assets relative to that folder and author all five state flows.
5. Run `./scripts/check.sh`. Invalid references, states, durations, movement clips, or APNG payloads fail the build-time checks instead of partially loading the pack.

The runtime discovers pet IDs from these folders and assigns distinct packs before reusing a pack for larger crowds. APNG assets provide their own aspect ratios.

## Example

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
    "jump": {
      "asset": "work.png",
      "holdAsset": "done.png",
      "durationMs": 500,
      "role": "stationary"
    },
    "sleep": {
      "asset": "sleep.png",
      "durationMs": 900,
      "role": "stationary"
    },
    "wave": {
      "asset": "wave.png",
      "durationMs": 900,
      "role": "stationary"
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
            "durationMs": 3000,
            "speedPxPerSecond": 32
          },
          { "type": "play", "clip": "jump" }
        ]
      }
    },
    "blocked": {
      "completion": "restart",
      "flow": { "type": "wait", "durationMs": 1000 }
    },
    "done": {
      "completion": "restart",
      "flow": {
        "type": "sequence",
        "steps": [
          { "type": "play", "clip": "jump" },
          { "type": "loop", "flow": { "type": "play", "clip": "sleep" } }
        ]
      }
    },
    "unknown": {
      "completion": "restart",
      "flow": { "type": "play", "clip": "jump" }
    }
  },
  "actions": {
    "wave": {
      "label": "Wave",
      "flow": { "type": "play", "clip": "wave" }
    }
  }
}
```

## Clip names

Keys inside `clips` are local, user-defined names. They are not predefined behaviors and do not need to match filenames. A key must start with a lowercase letter, use only lowercase letters, numbers, and hyphens, and contain at most 64 characters. `play` and `move` nodes reference these keys exactly.

A clip may set a generic `scale` from `0.5` through `2.5` when its composition needs more or less screen space. Scaling preserves the APNG's intrinsic aspect ratio and is independent of the clip name. Its `durationMs` must exactly match one APNG cycle. A transparent static `holdAsset` supplies the frozen final pose for any clip used by a completed visible `hold` state.

## Flow nodes

- `sequence` runs non-empty `steps` in order.
- `play` shows a named clip for its declared duration, optionally for a finite `count`.
- `move` shows a locomotion clip and moves forward for a fixed duration and positive speed.
- `wait` consumes time without moving or changing the current clip or visibility.
- `hide` hides the whole pet, including its label, shadow, and hit region, for a fixed duration.
- `choose` selects one positive-integer-weighted branch deterministically for that agent and state entry.
- `repeat` runs one child flow a finite positive number of times.
- `loop` repeats one time-consuming child until the Herdr state changes. A loop cannot contain another loop and cannot be used by a menu action.

A later `play` or `move` action restores visibility after `hide`. A `wait` in the same flow preserves the hidden state, while entry into a different Herdr state starts visible unless its new flow hides again. This makes flow-authored hiding available to any state or sequence without state-specific flow logic; the optional app-level completed-pet preference is a separate presentation override.

A state with `completion: "restart"` begins again when its root flow finishes. A state with `completion: "hold"` keeps its final pose and visibility without movement, using the final clip's required `holdAsset`. `completion` is never reached when a flow enters `loop`; use `restart` for that state because `hold` deliberately rejects loops. Flows cannot request directions, coordinates, turns, state changes, expressions, callbacks, or code execution.

## Validation and fallback

`compileBehaviorPack()` rejects unknown fields, missing states or clips, unsafe asset paths, missing pack-local files, unsafe clip scales, stationary movement clips, unsafe locomotion mirroring, invalid weights or timing, excessive nesting, and flows that can complete without consuming time. The asset check also rejects corrupt or misordered PNG chunks, invalid animation sequence numbers, unsafe dimensions, finite loops, invalid frame operations, timing mismatches, opaque canvases, effectively blank frames, hidden-RGB-only changes, and animations without perceptible visible changes. Bundled pack IDs must match their folder names. `resolveBehaviorPack()` returns a hidden built-in safe pack when standalone compilation fails.

The runtime owns movement and facing. A pack can only request forward movement. Direction changes happen only when the character reaches a screen edge; resizes preserve proportional position without turning the character. Horizontal drag-and-drop is therefore a village interaction rather than flow data: movement pauses while held and resumes from the released position without saving that position across app restarts.

User preferences are also outside flow data. The stable pack `id` keys one per-character preference entry for random-cast inclusion, size, opacity, labels, and motion comfort. Global preferences may also hide completed citizens after a delay. These settings may select packs or alter presentation, but they never add, remove, reorder, or reinterpret state and action nodes. Repeated citizens using the same pack intentionally share its preferences.

## Custom right-click actions

Action identifiers follow the same lowercase naming rule as clips. Labels must be trimmed and contain 1–24 characters. A pack may expose up to eight actions. Every action must finish within five minutes, so `loop` is rejected inside actions. A real Herdr state change always cancels the menu action immediately.

To add an action such as `wave`:

1. Add its transparent APNG to the pet folder.
2. Define a stationary clip with the APNG's exact cycle duration.
3. Add an `actions.wave` entry whose `flow` plays that clip.
4. Run `./scripts/check.sh` and rebuild the application.

Bundled pet folders are discovered at build time and remain immutable. Pet Studio saves user-created packs under `~/.pet-village/pet-packs/packs/` and reloads them immediately after a successful atomic activation. The runtime compiles those manifests through the same safe flow compiler and rejects bundled-ID collisions. Loose external folders are never watched or loaded.
