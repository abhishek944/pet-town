---
name: pet-sprite-apng
description: Creates or replaces Herdr pet animations from image-model-generated sprite sheets and deterministically assembles validated APNGs. Use whenever adding, repairing, or reviewing sleep, wave, celebration, work, or other pet animation assets.
compatibility: Requires the image_generate tool, Python 3, and Pillow.
---

# Pet sprite-sheet APNG workflow

Use `image_generate` for the artwork and the bundled scripts for deterministic extraction and APNG assembly. Never fake a requested action by adding motion lines, symbols, or effects to an otherwise static source pose.

## Non-negotiable action semantics

- **Wave:** the pet deliberately greets the viewer. A visible hand, paw, wing, branch, flipper, or equivalent limb must lift and move side-to-side through a complete wave arc. The face and attention should be directed toward the viewer where the character design permits it. Motion lines may support the action but cannot be the action.
- **Sleep:** the pet must settle into a visibly restful pose with closed eyes. Show a gentle breathing cycle. Floating Zs may support the action but cannot replace a sleeping pose.
- Preserve the source character’s identity, costume, palette, proportions, rendering style, equipment, and transparent background in every frame.
- Keep feet/body registration stable unless the action itself requires translation. Reject added limbs, missing equipment, character redesign, frame cropping, backgrounds, captions, borders, grid lines, or frame labels.

## Required process

1. Read the target pack’s `flow.json` and identify its source animation and intended facing.
2. Extract a clean reference frame:
   ```bash
   python3 .pi/skills/pet-sprite-apng/scripts/extract-reference.py \
     apps/pet-town/src/pets/<pet>/walk.png var/pet-sprite-sheets/<pet>/reference.png
   ```
3. Generate **one 2-column × 4-row sprite sheet per action** with `image_generate`. Pass the extracted frame as `Image 1: character identity and style reference`. Use a 1024×1536 transparent canvas and high quality. Follow [the prompt contract](references/prompt-contract.md).
4. Read and visually inspect the full sheet before conversion. Reject it if the gesture is ambiguous, the pet does not truly sleep or wave, identity drifts, cells are cropped, or the grid is not exactly 2×4.
5. Convert an accepted sheet into an eight-frame APNG:
   ```bash
   python3 .pi/skills/pet-sprite-apng/scripts/sheet-to-apng.py \
     var/pet-sprite-sheets/<pet>/<action>-sheet.png \
     apps/pet-town/src/pets/<pet>/<action>.png --total-duration-ms <clip-durationMs> \
     --contact var/pet-sprite-sheets/<pet>/<action>-contact.png \
     --height 320
   ```
   If the provider returns a simple white or light checkerboard backdrop instead of alpha, add `--remove-light-background`; never use that option to hide a complex or contaminated sheet. For this project's approved sleeping-state treatment, add `--sleep-z-trail` to bake the thick electric rising Zs into the APNG while keeping `flow.json` as the behavior owner.
6. Read the APNG and a contact sheet made from all frames. Confirm the complete motion, not only the first frame.
7. Run `pnpm run check:flow`, `pnpm run check:interactions`, and `pnpm run build`.

Do not overwrite an accepted APNG until its replacement sheet has passed visual inspection. Keep generated source sheets under `var/pet-sprite-sheets/` as evidence; only final APNGs belong in `apps/pet-town/src/pets/`.
