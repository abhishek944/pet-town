import { createTownAgents } from "./agents/index.js";
import { createTownBridge } from "./bridge/index.js";
import { createMayorPanel } from "./mayor/index.js";
import { createTownController } from "./control/index.js";
import { createCompanionPanel } from "./ui/companions.js";
import { createTerminalDock } from "./terminal/index.js";
import { createDockViewport } from "./dock-viewport.js";
import { createCompanionLabels } from "./ui/labels.js";

export function createPetTownExtension() {
  let runtime;
  return {
    id: "pet-town",
    init(context) {
      const agents = createTownAgents(context);
      let panel;
      let mayor;
      let focusSerial = null;
      const controller = createTownController(context, agents.records, () => panel?.render());
      const bridge = createTownBridge({
        onSnapshot(snapshot) {
          agents.reconcile(snapshot);
          controller.reconcileSelection();
          mayor?.setSnapshot(snapshot);
          panel?.render();
          const serial = snapshot.mayor?.focusSerial;
          if (focusSerial !== null && serial > 0 && serial !== focusSerial) {
            controller.followMayor();
          }
          focusSerial = serial ?? 0;
        },
        onConnection(connection) {
          panel?.setConnection(connection);
          mayor?.setConnection(connection);
          if (!connection.connected) {
            controller.select(null);
            agents.reconcile({
              v: 1,
              type: "snapshot",
              available: false,
              agents: [],
              mayor: { active: false },
            });
            panel?.render();
          }
        },
      });
      panel = createCompanionPanel(controller, agents.records, bridge, context);
      mayor = createMayorPanel({
        bridge,
        onFollowMayor: () => controller.followMayor(),
      });
      const labels = createCompanionLabels(context, agents.records, controller);
      const viewport = createDockViewport(context);
      const terminal = createTerminalDock({
        context,
        controller,
        bridge,
        onVisibility: (visible) => viewport.setVisible(visible),
      });
      runtime = { agents, controller, bridge, panel, mayor, labels, terminal, viewport };
      context.petTown = runtime;
      panel.render();
      bridge.start();
    },
    afterPlayerUpdate(deltaTime) {
      if (!runtime) return;
      const { agents, controller } = runtime;
      controller.beforeUpdate(deltaTime);
      agents.update(deltaTime);
      controller.afterUpdate(deltaTime);
    },
    update(deltaTime, context) {
      if (!runtime) return;
      const { agents, panel, mayor, labels, terminal, controller } = runtime;
      terminal.update(controller.selected, context);
      labels.update(deltaTime);
      panel.update(context);
      mayor.update(deltaTime, context, agents.records.get("pet-town-mayor"));
    },
    dispose(context) {
      if (!runtime) return;
      runtime.terminal.dispose();
      runtime.viewport.dispose();
      runtime.mayor.dispose();
      runtime.bridge.dispose();
      runtime.controller.dispose();
      runtime.agents.dispose();
      runtime.panel.dispose();
      runtime.labels.dispose();
      delete context.petTown;
      runtime = null;
    },
  };
}
