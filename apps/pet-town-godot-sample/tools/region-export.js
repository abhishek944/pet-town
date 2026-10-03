import { installPropDetailsExport, exportPropDetails } from "./region-prop-details.js";
import { json } from "./region-data.js";
import { selectRegion } from "./region-selection.js?sync=1";
import { exportTerrain } from "./region-terrain.js";
import { exportVegetation } from "./region-vegetation.js?sync=1";
import { exportProps } from "./region-props.js";
import { exportVoxels } from "./region-voxels.js";
import { exportEnvironment } from "./region-environment.js";
import { exportCompanions } from "./companion-export.js";
import { exportOcean } from "./ocean-export.js";
import { exportPlacementReservations } from "./region-reservations.js";

export async function exportRegion(ctx, report = () => {}) {
  report("Measuring every original dry-land cell…");
  const manifest = selectRegion(ctx);
  exportPlacementReservations(ctx, manifest);
  report(`Selected ${manifest.coverage.percent.toFixed(2)}% of original dry land`);
  await exportEnvironment(ctx, manifest);
  await exportVoxels(ctx, manifest);
  await exportTerrain(ctx, manifest, report);
  await exportVegetation(ctx, manifest, report);
  await exportProps(ctx, manifest, report);
  await exportPropDetails(ctx, manifest, report);
  manifest.propDetailsFile = "region-prop-details.json";
  await exportCompanions(ctx, manifest, report);
  await exportOcean(ctx, manifest, report);
  await json("region-manifest.json", manifest);
  window.__godotRegionManifest = manifest;
  report(
    `Complete: ${manifest.coverage.percent.toFixed(2)}% dry land; ${manifest.props.length} props; ${manifest.vegetation.instanceCount} vegetation instances`,
  );
  return manifest;
}
export function installRegionExport(ctx) {
  document.getElementById("godot-region-export")?.remove();
  const panel = document.createElement("div");
  panel.id = "godot-region-export";
  panel.style.cssText =
    "position:fixed;left:20px;top:160px;z-index:999999;background:#fff4dc;color:#342c23;padding:16px;border-radius:16px;font:14px sans-serif;max-width:650px";
  const button = document.createElement("button");
  button.textContent = "Export complete original Godot world";
  const status = document.createElement("output");
  status.style.display = "block";
  status.setAttribute("aria-label", "Godot region export status");
  status.textContent =
    "Ready: source terrain, textures, all vegetation and props in measured region";
  panel.append(button, status);
  document.body.append(panel);
  installPropDetailsExport(ctx, panel);
  const pathsButton = document.createElement("button");
  pathsButton.textContent = "Export placement reservations";
  panel.append(pathsButton);
  pathsButton.onclick = async () => {
    pathsButton.disabled = true;
    try {
      const bounds = window.__godotRegionManifest?.bounds ?? ctx.terrain.bounds;
      const reserved = exportPlacementReservations(ctx, { bounds });
      await json("region-reservations.json", reserved);
      status.textContent = `Placement reservations exported: ${reserved.corridors.length} approaches and ${Object.keys(reserved.pathCells).length} path cells`;
    } catch (error) {
      status.textContent = `Placement reservations failed: ${error.message}`;
    } finally {
      pathsButton.disabled = false;
    }
  };
  button.onclick = async () => {
    button.disabled = true;
    try {
      await exportRegion(ctx, (value) => {
        status.textContent = value;
      });
    } catch (error) {
      status.textContent = `Export failed: ${error.stack ?? error.message}`;
      console.error(error);
    } finally {
      button.disabled = false;
    }
  };
}
