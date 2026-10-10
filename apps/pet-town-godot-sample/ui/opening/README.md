# Paper picnic opening

Selected in the 2026-10-09 UI/UX interview: Paper picnic art and Everybody is playing motion. The four illustrated animals are original imagegen artwork, independent of connected agents and in-world pet models.

`art/picnic-portrait.png` is the approved clean plate. `art/picnic-landscape.png` is an imagegen landscape extension of that plate, keeping the quiet title area and picnic meadow. `art/picnic-poses.png` is the original transparent 1536×1024 pose atlas; rows are irregular and must use the rectangles in `picnic.gd`. Do not replace its discrete poses with smooth bobbing.

`picnic.gd` draws the fixed backdrop and registered feet positions, animates six poses at five poses per second with offset phases, and stops processing while hidden or reduced motion is enabled. `welcome.gd` owns title, loading, ready, failure, and input. `tools/render-boot.gd` generates the static first pose.

Interview selection, prompts, approved browser reference, native comparison, and user walkthrough evidence are retained under `var/playful-opening/`. Native render/constructor checks do not establish live interactive acceptance.
