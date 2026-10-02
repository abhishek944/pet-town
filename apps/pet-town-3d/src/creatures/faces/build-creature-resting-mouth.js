import { colorCreatureGeometryVertices } from "../geometry/color-creature-geometry-vertices.js";
import { getCreatureColor } from "../geometry/get-creature-color.js";
import { creaturesState } from "../state.js";
import { createCreatureTaperedTubeGeometry } from "../geometry/create-creature-tapered-tube-geometry.js";
import { createCreatureFacePartGroup } from "./create-creature-face-part-group.js";
import { projectCreatureFaceCurve } from "./project-creature-face-curve.js";
export function buildCreatureRestingMouth(
  mouth,
  placeMouth,
  createOpenMouth,
  width,
  materials,
  flattenMouth,
  mouthSurface,
  anchor,
  strokeWidth,
  createSmile,
  parent,
  face,
) {
  let closedMouth;
  if (mouth.style === `grin`) {
    closedMouth = placeMouth(
      createCreatureFacePartGroup(
        `mouthClosed`,
        createOpenMouth(width, width * 0.55, width * 0.35, 0.45),
        materials.eye,
      ),
      0,
      width * 0.1,
    );
  } else if (mouth.style === `o`) {
    let values7 = [];
    for (let index8 = 0; index8 <= 16; index8++) {
      let result29 = (index8 / 16) * Math.PI * 2;
      values7.push([Math.cos(result29) * width * 0.55, Math.sin(result29) * width * 0.7]);
    }
    closedMouth = createCreatureFacePartGroup(
      `mouthClosed`,
      flattenMouth(
        colorCreatureGeometryVertices(
          createCreatureTaperedTubeGeometry(
            projectCreatureFaceCurve(mouthSurface, anchor, values7, strokeWidth * 0.4),
            strokeWidth * 0.8,
            {
              tSeg: 24,
              rSeg: 6,
              caps: false,
            },
          ),
          (copyValue5) => copyValue5.copy(getCreatureColor(creaturesState.creatureFaceInkColor)),
        ),
      ),
      materials.eye,
    );
  } else {
    closedMouth = createCreatureFacePartGroup(
      `mouthClosed`,
      createSmile(mouth.style),
      materials.eye,
    );
  }
  parent.add(closedMouth);
  face.mouth.closed = closedMouth;
  let openWidth = width * (mouth.openScale ?? 0.9);
  let openMouth = placeMouth(
    createCreatureFacePartGroup(
      `mouthOpen`,
      mouth.style === `grin`
        ? createOpenMouth(width * 1.1, width * 0.8, width * 0.4, 0.3)
        : createOpenMouth(openWidth, openWidth * 0.8, openWidth * 0.45),
      materials.eye,
    ),
    mouth.style === `grin` ? 0.02 : (mouth.openDrop ?? 0.04),
    openWidth * 0.12,
  );
  parent.add(openMouth);
  face.mouth.open = openMouth;
}
