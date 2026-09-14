# Sprite-sheet prompt contract

Use this structure for each `image_generate` call and repeat every invariant on retries.

```text
Use case: production 2D animation sprite sheet for a transparent desktop pet.
Input images: Image 1 is the exact character identity, costume, palette, proportions, equipment, linework, shading, and scale reference.
Canvas: exactly 2 columns by 4 rows, eight equal landscape cells, read left-to-right then top-to-bottom. Transparent background. No gutters, borders, grid lines, labels, captions, floor, scenery, shadows cut off by a cell, or checkerboard pattern.
Character registration: one complete character per cell, centered on the same baseline and at the same scale. Keep the entire character and every moving limb inside each cell.
Action: <precise action contract below>.
Sequence: eight successive animation frames that form a smooth seamless loop; frame 8 transitions naturally to frame 1.
Preserve exactly: character identity, silhouette except for action motion, costume, colors, equipment, rendering medium, outline weight, lighting, and source-facing conventions.
Avoid: redesign, camera movement, zoom, added or missing limbs, duplicated props, text, generic motion effects standing in for the physical action, and unrelated movement.
```

## Wave action

```text
The pet notices and greets the viewer. It looks toward the viewer where anatomically possible, raises its nearest clearly visible hand/paw/wing/flipper/branch, opens or presents that limb, and swings it side-to-side through a clear friendly wave arc before returning. The torso stays registered and the greeting reads clearly even with all motion lines removed. Do not merely shake the whole character or draw curved lines beside a static pose.
```

Adapt the waving limb to the character while keeping the meaning unmistakable. A plant waves a branch; a ghost waves an arm; a quadruped balances naturally and waves a front paw.

## Sleep action

```text
The pet is genuinely asleep in a comfortable resting, curled, seated-slumped, or lying pose appropriate to its anatomy. Eyes remain closed. Show a subtle breathing cycle through chest/body rise and fall. Small floating Zs may rise and fade, but the restful pose and closed eyes must communicate sleep without them. Keep the loop calm and seamless.
```
