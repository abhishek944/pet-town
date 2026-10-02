/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import * as THREE from "three";
import { createCreatureFacePartGroup } from "./create-creature-face-part-group.js";
import { mergeCreatureGeometries } from "../geometry/merge-creature-geometries.js";
export function buildCreatureHappyMouth(
  definition,
  createOpenMouth,
  width,
  createTongue,
  placeMouth,
  materials,
  createSmile,
  strokeWidth,
  parent,
  face,
) {
  let happyStyle = definition.happy?.mouth;
  if (happyStyle) {
    let result30;
    if (happyStyle === `tongue`) {
      let callback4Result = createOpenMouth(width * 1.05, width * 0.85, width * 0.45, 0.4);
      let callback5Result = createTongue(width * 0.55, width * 0.7, 0.8);
      callback5Result.translate(0, -width * 0.35, width * 0.45);
      result30 = placeMouth(
        createCreatureFacePartGroup(
          `mouthHappy`,
          mergeCreatureGeometries([callback4Result, callback5Result]),
          materials.eye,
        ),
        0.03,
        width * 0.1,
      );
    } else if (happyStyle === `baa`) {
      result30 = placeMouth(
        createCreatureFacePartGroup(
          `mouthHappy`,
          createOpenMouth(width * 0.95, width * 1.15, width * 0.5),
          materials.eye,
        ),
        0.06,
        width * 0.12,
      );
    } else if (happyStyle === `grinTongue`) {
      let callback4Result2 = createOpenMouth(width * 0.95, width * 0.42, width * 0.3, 0.55);
      let callback5Result2 = createTongue(width * 0.28, width * 0.45, 0.2);
      callback5Result2.translate(0, -width * 0.12, width * 0.32);
      let group4 = new THREE.Group();
      group4.name = `tongueFlick`;
      let mesh5 = new THREE.Mesh(callback5Result2, materials.eye);
      group4.add(mesh5);
      result30 = placeMouth(
        createCreatureFacePartGroup(`mouthHappy`, callback4Result2, materials.eye),
        0.02,
        width * 0.08,
      );
      result30.add(group4);
    } else if (happyStyle === `bigGrin`) {
      let callback4Result3 = createOpenMouth(width * 1.25, width * 0.95, width * 0.45, 0.35);
      let callback5Result3 = createTongue(width * 0.55, width * 0.35, 0.1);
      callback5Result3.translate(0, -width * 0.45, width * 0.1);
      result30 = placeMouth(
        createCreatureFacePartGroup(
          `mouthHappy`,
          mergeCreatureGeometries([callback4Result3, callback5Result3]),
          materials.eye,
        ),
        0.03,
        width * 0.1,
      );
    } else {
      if (happyStyle === `o`) {
        result30 = placeMouth(
          createCreatureFacePartGroup(
            `mouthHappy`,
            createOpenMouth(width * 0.6, width * 0.75, width * 0.4),
            materials.eye,
          ),
          0.02,
          width * 0.08,
        );
      } else {
        if (happyStyle === `smile`) {
          result30 = createCreatureFacePartGroup(
            `mouthHappy`,
            createSmile(`smile`, width * 1.35, strokeWidth * 1.15),
            materials.eye,
          );
        }
      }
    }
    if (result30) {
      parent.add(result30);
      face.mouth.happy = result30;
    }
  }
}
