# Repository guidance

## Pet-to-agent focus

Before changing pet click handling, macOS panel/window activation, focus helpers,
Herdr selection, or Codex deep links, read [docs/pet-focus.md](docs/pet-focus.md).
It records the user-confirmed working flow, its owning files, failed approaches,
and regression checks.

Preserve the combination of nonactivating panel state, separate focus helper,
and main-run-loop servicing during activation. Do not simplify any one away
based only on passing builds or a successful focus return value. Verify the
direct visible transition, without an intermediate Pet Town/default-desktop
jump; if tool access prevents that, report the limit and seek user observation.
