/** Block palette, terrain-name aliases and fallback block skins. */
import { buildingState } from "../state.js";
export function prepareBuildingPalette() {
  buildingState.buildingPaletteDefinitions = [
    {
      key: `grass`,
      name: `Grass`,
      id: 1,
      surface: `grass`,
      dust: `#86d464`,
      colors: {
        top: `#86d464`,
        side: `#b27c4e`,
        bottom: `#a8744a`,
      },
    },
    {
      key: `dirt`,
      name: `Soil`,
      id: 2,
      surface: `dirt`,
      dust: `#a9774a`,
      colors: {
        top: `#a9774a`,
        side: `#a9774a`,
        bottom: `#a9774a`,
      },
    },
    {
      key: `stone`,
      name: `Cobblestone`,
      id: 3,
      surface: `stone`,
      dust: `#a8a39a`,
      colors: {
        top: `#a8a39a`,
        side: `#a8a39a`,
        bottom: `#a8a39a`,
      },
    },
    {
      key: `sand`,
      name: `Sand`,
      id: 4,
      surface: `sand`,
      dust: `#f3dfa6`,
      colors: {
        top: `#f3dfa6`,
        side: `#f3dfa6`,
        bottom: `#f3dfa6`,
      },
    },
    {
      key: `planks`,
      name: `Wood Planks`,
      id: 5,
      surface: `wood`,
      dust: `#dca56a`,
      colors: {
        top: `#dca56a`,
        side: `#dca56a`,
        bottom: `#dca56a`,
      },
    },
    {
      key: `log`,
      name: `Log`,
      id: 6,
      surface: `wood`,
      dust: `#8d5d36`,
      colors: {
        top: `#e2b97e`,
        side: `#8d5d36`,
        bottom: `#e2b97e`,
      },
    },
    {
      key: `brick`,
      name: `Brick`,
      id: 7,
      surface: `stone`,
      dust: `#d8735a`,
      colors: {
        top: `#d8735a`,
        side: `#d8735a`,
        bottom: `#d8735a`,
      },
    },
    {
      key: `glass`,
      name: `Glass`,
      id: 8,
      surface: `glass`,
      dust: `#d9f3ff`,
      transparent: true,
      colors: {
        top: `#cdeeff`,
        side: `#cdeeff`,
        bottom: `#cdeeff`,
      },
    },
    {
      key: `roof`,
      name: `Roof Tile`,
      id: 9,
      surface: `stone`,
      dust: `#e0604f`,
      colors: {
        top: `#e0604f`,
        side: `#e0604f`,
        bottom: `#b84a3c`,
      },
    },
    {
      key: `leaves`,
      name: `Leafy Block`,
      id: 10,
      surface: `grass`,
      dust: `#5fb44d`,
      colors: {
        top: `#5fb44d`,
        side: `#5fb44d`,
        bottom: `#5fb44d`,
      },
    },
    {
      key: `flower`,
      name: `Flower Bed`,
      id: 11,
      surface: `grass`,
      dust: `#ff9ec0`,
      colors: {
        top: `#71c95a`,
        side: `#71c95a`,
        bottom: `#a8744a`,
      },
    },
    {
      key: `lantern`,
      name: `Lantern`,
      id: 12,
      surface: `wood`,
      dust: `#ffd36b`,
      emissive: 1,
      colors: {
        top: `#6b4a2e`,
        side: `#ffcf6a`,
        bottom: `#6b4a2e`,
      },
    },
  ];
  buildingState.buildingBlockIds = Object.fromEntries([
    [`air`, 0],
    ...buildingState.buildingPaletteDefinitions.map((keyValue) => [keyValue.key, keyValue.id]),
  ]);
  buildingState.buildingPaletteByKey = Object.fromEntries(
    buildingState.buildingPaletteDefinitions.map((keyValue) => [keyValue.key, keyValue]),
  );
  buildingState.buildingBlockAliases = {
    grass: [`grass`, `grassblock`, `turf`, `lawn`],
    dirt: [`dirt`, `soil`, `earth`],
    stone: [`cobblestone`, `cobble`, `stone`, `rock`],
    sand: [`sand`, `beach`],
    planks: [`planks`, `plank`, `woodplanks`, `woodplank`, `boards`, `wood`],
    log: [`log`, `woodlog`, `trunk`, `bark`],
    brick: [`brick`, `bricks`, `redbrick`],
    glass: [`glass`, `window`, `pane`],
    roof: [`roof`, `rooftile`, `roofing`, `shingle`, `tiles`],
    leaves: [`leaves`, `leaf`, `foliage`, `hedge`],
    flower: [`flowerbed`, `flowerblock`, `flower`, `flowers`, `blossom`],
    lantern: [`lantern`, `lamp`, `glowstone`, `lampblock`],
  };
  buildingState.buildingBlockFallbacks = {
    brick: [`clay`, `cobblestone`, `stone`],
    glass: [`sandstone`, `stone`],
    roof: [`clay`, `stone`],
    leaves: [`mossystone`, `grass`, `dirt`],
    flower: [`grass`, `dirt`],
    lantern: [`planks`, `log`, `stone`],
  };
}
