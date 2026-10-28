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
- Source height-aware directional sky fog, firefly suppression and sharpen retain their original ordering. The native screen-space AO layer, its blur/upscale/tint and both composite/downsample consumers are removed to avoid camera-following ground darkening.
- Original capped lighten mist, focus-aware/desaturated aerial haze, quarter-resolution sun mask and two radial-shaft passes with original daylight weighting.
- Source customized UnrealBloom: sky-damped luminance highpass, soft knee, five separable Gaussian mips, paired linear taps, original warm tints, bloom-radius factors and day/night strength.
- Original focus smoothing and screen-space/near/far CoC, half-resolution CoC-weighted downsample, four Kawase passes at the original offsets/resolutions, and two-stage blur composite. Reverse-Z depth is reconstructed in native Godot coordinates. UI and sky receive no full-strength depth blur.

Source owners are `apps/pet-town-3d/src/rendering/postprocessing/{prepare,update-post-color-grade,update-post-focus,create-post-pipeline}.js` and `post-shaders/{prepare.js,assets/prepare-rendering-post-shaders-73.glsl}`. Tone mapping and color transfers derive from Three.js shader chunks; their MIT notice is included in `THREE-LICENSE.txt`.

Native ocean adjustment: the screen-reading refraction material uses `depth_draw_always` so the post-transparent compositor reads water surface depth rather than seabed or empty sky. Far-focus blur strength is 0.15 (source 0.5), preserving surface ripples and more distant scenery detail while retaining near/tilt blur and underwater suppression. Both CoC passes identify sky by empty reverse-Z depth (`<= 0.000001`), matching scene fog, instead of treating geometry beyond 95% of camera far as sky. Aerial haze uses the same sky boundary instead of abruptly switching off at 98% of camera far. Render-only horizon water writes depth `0.000002`, so it receives continuous geometry blur/haze. Camera far, terrain culling, water palette, and navigation boundaries are unchanged.

The pipeline defaults to the source low quality tier (shafts 25%, bloom chain starts at 25%). `post.atmosphere.quality` accepts `low`, `med` or `high` for sharpen and bloom scaling. Legacy AO fields remain in the packed atmosphere layout for compatibility, but create no AO targets or dispatches. Scratch targets rebuild only when size/tier changes. The source browser's whole-world adaptive-quality scheduler is not ported, so this module does not silently alter native geometry/shadows/MSAA.

Remaining boundaries: fully underwater screen refraction/caustics and half-submerged lens masks are not yet ported; the existing bool applies underwater grade and disables atmospheric shafts/haze/mist. Camera fallback focus remains the source default 26 when the actor is offscreen; the source terrain-ray fallback is not ported. Native light/shadow/sky/material fidelity belongs to the effects/world modules. The native daylight owner disables cast sun shadows while retaining directional and hemisphere illumination; world-anchored blob masks remain.

Validation uses Godot 4.7.2 headless editor import and native Metal execution for the seven registered compute shaders. Import alone does not prove runtime pipeline or visual correctness. Per-view scratch targets reuse allocations until viewport resize; no production frame readback or CPU image processing occurs.
