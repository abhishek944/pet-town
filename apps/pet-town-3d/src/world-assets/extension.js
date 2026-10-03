import { createWorldAssetController } from "./controller.js";
import { createAssetLibrary } from "./ui/index.js";

export function createWorldAssetsExtension() {
  let controller;
  let library;
  return {
    id: "world-assets",
    init(context) {
      context.worldAssets = { libraryOpen: false };
      controller = createWorldAssetController(context);
      library = createAssetLibrary(context, controller);
    },
    update(deltaTime, context) {
      // Props and vegetation own fine-grained terrain subscriptions. Rebuilding
      // their complete worlds here turns every block edit into a multi-second stall.
      library?.update();
    },
    dispose(context) {
      library?.dispose();
      controller?.dispose();
      delete context.worldAssets;
    },
  };
}
