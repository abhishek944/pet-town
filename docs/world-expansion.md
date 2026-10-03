# World expansion

Pet Town's expansion is being built in substantial stages, with user review between stages. The final goal is at least three times the original land area, with distinct places and activities. The user reviewed Sunmeadow and Willowmere. Shellhaven has reached the numerical 3× target and is presented for final manual review.

## Stage one: Sunmeadow

The authored eastern peninsula adds 5,722 dry terrain columns. The original world has 8,223; the expanded base world has 13,945, or 1.70 times the original area. The final minimum is 24,669. Ocean inside the larger grid does not count. These figures describe the shipped terrain before a player's saved block edits.

Original dry-land blocks, original village placements, the plaza and bridge remain unchanged. All added land connects to the existing island through terrain steps of one voxel or less. Player collision and manual walking still require runtime review.

The new district contains two cottages, three decorative gardens, a fruit stand, a campfire, benches, lamps, signposts and trail stones. Fixed coordinates and terrain shapes define its composition. Existing art builders supply the models and textures.

Press **J** or click **Journal**. The unified journal has **Experiences**, **Places** and **Collection** pages, covering all enabled districts and ocean destinations. Sunmeadow supplies five destinations, discovery stamps, gardening and a photo action. Travel in Places uses the original explorer and checks current restored terrain and colliders; following a companion disables travel. Existing building, swimming, jumping, gliding, petting and photography remain available throughout the expanded world. See [journal controls and review steps](journal.md).

At **Picnic Garden**, plant six flowers, then water twice. Seeds become seedlings and then coral, lavender and golden blossoms. Growth and discovery stamps use the current build's local storage namespace, independently of world edits. Storage errors retain existing progress and report failure. Editing the whole flower-bed support area away hides the garden and disables tending until level, dry ground is restored.

## Stage-one review

1. Enter the world, press **J**, and visit **Sunmeadow Gate**. Walk the route into the district and inspect the connection to the old island.
2. Visit **Picnic Garden**, plant seeds and water twice. Close the journal to inspect the visible flowers. Digging or raising soil beneath the bed should hide it; restoring level soil should reveal the saved flowers again.
3. Visit **Stargazer Camp**, **Cloudrest Lookout**, and **Sunpetal Shore**. Inspect the paths, buildings, views and walking clearance; try photo mode at the lookout.
4. Build and remove blocks in the new district. Reopen the world to check saved blocks, stamps and flowers. In a browser, these saves stay separate from the native Mac app.
5. While the journal is open, movement, building and material shortcuts should stay inactive. **J/Escape** closes it, and **H/P** hands off to settings/photo mode. Following a companion should disable travel with a Leave instruction.
6. Report the visual direction, density, activities and smoothness before the next substantial expansion begins.

## Stage two: Willowmere

The northern woodland adds another 6,307 dry terrain columns, bringing the world to 20,252, or 2.46 times the original area. Original terrain and all Sunmeadow dry blocks and metadata remain unchanged. All twelve thousand added columns remain connected by routes with steps of one voxel or less. Each authored Willowmere trail also has a center route with no step higher than one voxel.

The lake occupies 416 wet columns inside an enclosed shoreline. A complete loop follows its bank, with a trail to Fernridge, a woodland cottage and kitchen garden, and the Lantern Grove. Forty fixed scenic props and thirty-three trail stones supply camp corners, reading benches, shoreline rocks, lamps and signposts. All cottage, garden and stall foundations are flat. Models and terrain use existing world builders; the fishing and lantern features own their small additional geometry.

The **J** journal now includes ten destinations. At **Willowmere Lake**, cast a line from beside the fishing rod, wait roughly three to four seconds, then choose **Reel now!** during the four-second nibble window. A successful catch saves a discovery before showing the fish. **Gently release fish** returns it with a splash. Three fish can be collected in the journal: Pebble Minnow, Silver Willowfin and Amber Sunperch. Closing the journal, leaving the shore, following a companion, opening another UI, hiding the document or losing focus puts the cast away. Fishing requires level shore support and open water beneath the bobber; terrain edits can suspend it until those conditions are restored.

At **Lantern Grove**, choose **Kindness**, **Courage**, or **Calm** in the journal to hang a warm lantern. Up to eight saved lanterns sway between two posts and light the grove. Visit after dusk to see their glow. Both complete post footprints require level, dry support; removing that support hides the lanterns without erasing saved wishes. Willowmere uses a separate namespaced version-one local storage record, preserving the existing Sunmeadow record and browser/native save separation.

## Stage-two manual review checkpoint

1. Press **J**, visit **Woodland Gate**, and walk into the lake district. Inspect the connection, vegetation, lake circuit and scenery clearance.
2. Visit **Willowmere Lake**, open **J**, scroll to fishing, cast, wait for **Reel now!**, reel and release. Try another cast; check the visible rod, bobber, catch, collection and timing. Close the journal or switch away during a cast; reopening should offer a fresh cast.
3. Visit **Lantern Grove**, open **J**, and hang wishes. Close it to inspect the posts and lanterns; return after dusk for the glow.
4. Visit **Fernridge** and **Willowmere Cottage**. Explore freely, build a shelter or take a photo. Review the hills, forest density, lake views and walking comfort.
5. Reopen the world and check both districts' discovery stamps, flowers, fish collection and wish lanterns. World edits should remain at their original coordinates. Inspect the journal with a smaller window or open terminal dock.
6. Report activity feel, scenery and smoothness before the final expansion starts. This checkpoint is not completion of the three-times goal.

## Owning files

`apps/pet-town-3d/src/world-expansion/` owns fixed district shapes, authored scenic placements, gardening, discoveries, travel and the journal. `terrain/system/` shares the larger dimensions across geometry, queries, editing and water masks. `building/persistence/` preserves original-world save compatibility. Desktop and public extension registries include the new activity extension.

The original 128-cell island generator remains intact and is embedded at its original coordinates inside a 256-cell grid. All three districts retain the same save coordinates.

## Stage three: Shellhaven

The southern coast adds 6,010 dry columns, bringing the complete authored world to **26,262 dry columns, or 3.19 times the original 8,223**. The target was 24,669. Ocean bounds and the tide pool do not count as land. The original island and both reviewed districts' dry blocks and metadata remain unchanged. All 18,039 added dry columns are connected through terrain steps of one voxel or less.

Shellhaven contrasts with the meadow and forest: broad sandy walks, a small enclosed tide pool, a sculpted inlet open to the sea, a grassy bluff and a driftwood camp. Seven authored routes connect the five new journal destinations: **Shellhaven Gate**, **Shell Cove**, **Tidepool Garden**, **Seabreeze Bluff**, and **Driftwood Camp**. The bluff has a climb to fourteen blocks above the seabed, with a sea view for photography or gliding using the existing controls. Building, swimming and exploring remain available.

Six small shells lie at fixed dry sites along the coastal walks. Follow their journal hints, walk nearby, and explicitly collect them through **J**. A successful save removes a shell from the shore and adds it to the visible collection shelf at Shell Cove. Stand beside the shelf to **Feature** a favorite shell, marking it with a golden sparkle. The wooden shelf is solid for characters and the camera while supported. Terrain edits can temporarily hide an unsupported shell or shelf without deleting collection progress. Shellhaven uses its own namespaced version-one local storage record, preserving both previous districts' saves. Browser and native progress remain separate.

## Final manual review checkpoint

1. Open **J** and visit **Shellhaven Gate**. Walk south and inspect the transition from the old island, sandy paths and new coastal composition.
2. Visit **Shell Cove**, read the six shell hints in **J**, and hunt along the trails. Open the journal near a shell to collect it. Return to the cove shelf to see the saved collection.
3. Visit **Tidepool Garden**, walk around the water, and follow the western route to **Driftwood Camp**. Inspect the beach, inlet, camp and cottage clearances.
4. Visit **Seabreeze Bluff**, turn toward the sea, take a photo or glide to the beach. Explore and build freely throughout all three districts.
5. Reopen the world and check all districts' stamps, garden, fish, wishes, collected shells and block edits. Dig under a shell or shelf, then restore dry level support; the collection should remain saved.
6. Review the final scenery, activity feel and smoothness. Numerical land size has passed 3×; final visual and gameplay acceptance remains this manual checkpoint.

## Approved asset composition

The default scenery now uses all 26 approved collection designs at 60 fixed supported sites: 54 replacements and six added landmarks. Eleven different buildings give the village, Sunmeadow, Willowmere and Shellhaven distinct silhouettes. Curated benches and five light families replace repeated furniture where their full footprints have level, dry support. Narrow slopes retain the smaller original furniture. The original animated windmill, bridge, campfires, activity locations, terrain and collection progress remain intact.

`src/world-assets/composition/` owns exact placements, named legacy replacements, short door paths and supply relocations. This overlay also applies to older saved asset baselines without rewriting storage. Personal asset edits take precedence; conflicting default sites or approach stones are skipped. Relocated supplies retain their old placement keys. Full terrain footprints are revalidated after block edits; unsupported new landmarks suspend until support returns. The **K** library still supplies all 26 designs for later additions or replacements; **Restore original** returns to the curated default composition.

Reload the town to see the placements. For final live review, walk between each district's homes and activities, inspect lighting after dusk, and confirm saved personal additions and replacements survive another reload. The retained placement preview uses production models and actual terrain with foliage hidden to make clearances easy to inspect; it does not establish live character walking or camera behavior.
