# Native action sound bank

`generate.py` renders the original Three/WebAudio building, editing and feedback recipes into 75 stereo PCM clips. The source oscillator glide, percussion attack/exponential decay, colored-noise buffers, filter bands/Q, pentatonic notes, bell/mallet harmonics, event offsets and stereo pans are preserved. Break effects have three seeded material variants. The source sequencer's initial key (0) is used; native music-key modulation and the shared WebAudio convolution/compressor graph are not part of this action bank.

The cached 24-player pool avoids synthesis, file I/O and node creation when placing/breaking blocks or clicking the palette. Files are read once at setup, including before Godot's WAV import; imported resources are the exported-build fallback. Master volume affects active voices immediately, and muting stops one-shots so old sounds do not resume later.

The source recipes are under `apps/pet-town-3d/src/audio/sound-effects/` and `apps/pet-town-3d/src/audio/synthesis/`. Regenerate using `python3 apps/pet-town-godot-sample/scripts/effects/action_audio/generate.py`.

Root integration:

```gdscript
builder.edited.connect(ambience.block_edited.bind(builder.store.definitions))
# After selecting the block, including keyboard/wheel/middle-copy:
ambience.play_effect("select", {"index": builder.selected})
# After capturing the photo image:
ambience.play_effect("shutter")
```

Other source cues available through `play_effect`: `pet`, `start`, `open`, `close`, `click`, `deny`, `undo`, `redo`, `toast`, `banner`. Avoid playing both the existing wildlife bell and the new `pet` cue. For source-accurate undo/redo, set `ambience.suppress_block_audio=true` around `builder.undo(...)`, restore it, then play `undo` or `redo` only if the history operation succeeded.

No native/headless application launch was performed while the root task was checking live gameplay. Generated PCM headers and source line limits were inspected; audible/runtime validation belongs to that live pass.
