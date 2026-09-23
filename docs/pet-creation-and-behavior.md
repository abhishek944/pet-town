# Pet creation and behavior

**User goal:** Create a local 2D pet from APNG animations and decide how it looks and moves for each agent state.

```text
Pet Studio draft
  → import and validate APNGs
  → assign an APNG and action to each visible state
  → validate and save behavior pack
  → village reloads the pet catalog
  → live agent state selects the pet's behavior
```

## Create a pet

1. Open **Preferences… → Pet Studio**, choose **Create a new pet**, and give it a name. Pet Studio opens a local draft.
2. Import at least one transparent, looping APNG. The import validates its frame structure, dimensions, size, decoding, and duration before the animation is available for assignment. More APNGs can be imported for distinct states.
3. For `idle`, `working` (Running), `blocked`, `done` (Completed), `unknown`, and `listening`, choose an APNG and either **Idle** or **Walking**. Selecting **Hidden** makes that state invisible and removes the need for an APNG. The same APNG can serve several states. Idle and Unknown start hidden by default.
4. Choose **Validate & save pet**. A new pet needs at least one visible state. The backend validates all six assignments, writes the pack and its imported assets under the user's Pet Town data, registers the pet in preferences, and asks the village to reload its catalog. Pet Studio reports a reload warning if saving succeeded but automatic reload did not.
5. When a live agent is assigned this pet, its normalized state selects that pet's APNG and movement action. **Idle** plays the APNG in place; **Walking** moves the pet horizontally and turns it at the screen edges. Hidden states draw no pet, label, or click target.

## Extend an existing pet

Choose **Extend a pet** and select a base pet. The draft can reuse its existing clips and import new APNGs. From a pet's Settings state row, **+ Add** or **Replace** opens a file chooser; after you choose an APNG, Pet Studio validates it, assigns it to that state, and keeps the existing Idle/Walking action. You can still choose an already-imported clip from the state mapping selector. Pet Studio stages the extension, compiles it to check compatibility, then activates it and reloads the village. If the base pet changes during review, activation asks for a fresh draft rather than replacing the changed version.

## Draft and assistant boundaries

Discarding a draft removes its temporary files without publishing a pet. If validation fails, the draft remains available for correction. The optional mayor assignment has additional Walking and Listening APNG requirements; those are checked before save. These Pet Studio packs control the **2D** pet appearance. The Godot town uses its own KayKit 3D companions and authored activity markers.

**Format and checks:** [Pet behavior packs](behavior-packs.md), [bundled pet folders](../apps/pet-town/src/pets/README.md), and `pnpm run check:flow` from the repository root.
