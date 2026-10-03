import shell from "./settings.html?raw";
import companion from "./settings-panel-companion.html?raw";
import world from "./settings-panel-world.html?raw";
import help from "./settings-panel-help.html?raw";
import about from "./settings-panel-about.html?raw";

export default shell.replace(
  "\n    <!-- SETTINGS_TAB_PANELS -->\n",
  companion + world + help + about,
);
