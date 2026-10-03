# Source world postprocessing

`cozy_post.gd` installs a scene-only `CompositorEffect` after transparent 3D rendering, before Godot's final output. Forward+ / Metal is required by this sample. Canvas UI is composed afterwards and remains ungraded.

```gdscript
var post = preload("res://scripts/post/cozy_post.gd").new()
add_child(post)
post.setup(world_environment)
# Each frame, after daylight sample updates:
post.update(daylight.sample.sun_direction.y, daylight.sample.exp, delta, camera, actor)
```

The final optional argument is the underwater bool. Sun elevation means direction.y (the sine of the orbit angle), as in Three's `sky.sunElevation`. Exposure is the original daylight keyframe `exp`. The installer sets Environment LINEAR, exposure 1, disables built-in glow/adjustment/SSAO/fog, and the native sky must no longer use inverse ACES.

Exact source ports:

- Three Neutral tone mapping, sRGB output transfer and inverse transfer (returning display-graded color to Godot's linear output buffer).
- All three day/golden/night color-grade presets and `sampleFxDaylightWeights`; underwater grade smoothing.
- White balance, lift/gamma/gain, shadow/highlight tints, vibrance, contrast, green hue shift, magenta suppression, chroma knee, highlight shoulder, colored vignette and original 8-bit dither. Film grain stays at its source default of zero.
- Source screen-space AO (radius 2.2, intensity 2.7, power 1.5), bilateral blur, depth-aware upscale and lavender tint. Source height-aware directional sky fog, firefly suppression and sharpen run in their original ordering.
- Original capped lighten mist, focus-aware/desaturated aerial haze, quarter-resolution sun mask and two radial-shaft passes with original daylight weighting.
- Source customized UnrealBloom: sky-damped luminance highpass, soft knee, five separable Gaussian mips, paired linear taps, original warm tints, bloom-radius factors and day/night strength.
- Original focus smoothing and screen-space/near/far CoC, half-resolution CoC-weighted downsample, four Kawase passes at the original offsets/resolutions, and two-stage blur composite. Reverse-Z depth is reconstructed in native Godot coordinates. UI and sky receive no full-strength depth blur.

Source owners are `apps/pet-town-3d/src/rendering/postprocessing/{prepare,update-post-color-grade,update-post-focus,create-post-pipeline}.js` and `post-shaders/{prepare.js,assets/prepare-rendering-post-shaders-73.glsl}`. Tone mapping and color transfers derive from Three.js shader chunks; their MIT notice is included in `THREE-LICENSE.txt`.

The pipeline defaults to source medium quality (AO 35% with 8 samples, shafts 25%, bloom chain starts at 25%). `post.atmosphere.quality` accepts `low`, `med` or `high` with the original AO, sharpen and bloom scales; scratch targets rebuild only when size/tier changes. The source browser's whole-world adaptive-quality scheduler is not ported, so this module does not silently alter native geometry/shadows/MSAA.

Remaining boundaries: native transparent-surface depth/alpha semantics may differ from Three's explicit water alpha AO-exclusion mask. Fully underwater screen refraction/caustics and half-submerged lens masks are not yet ported; the existing bool applies underwater grade and disables atmospheric shafts/haze/mist. Camera fallback focus remains the source default 26 when the actor is offscreen; the source terrain-ray fallback is not ported. Native light/shadow/sky/material fidelity belongs to the effects/world modules.

Validation: Godot 4.7.2 headless editor import compiled all nine compute shaders; headless GDScript checks pass. Metal pipeline execution and visual comparison are owned by the root task. Per-view scratch targets reuse allocations until viewport resize; no frame readback or CPU image processing occurs.
