/** Optional features share the game loop and own their cleanup. */
export function createExtensionRegistry(context) {
  const systems = new Map();

  function remove(id) {
    const system = systems.get(id);
    if (!system) return false;
    systems.delete(id);
    system.dispose?.(context);
    return true;
  }

  function add(system) {
    if (!system?.id || typeof system.id !== "string") {
      throw new TypeError("A game extension needs a non-empty string id.");
    }
    if (systems.has(system.id)) {
      throw new Error(`Extension already registered: ${system.id}`);
    }
    systems.set(system.id, system);
    try {
      system.init?.(context);
    } catch (error) {
      systems.delete(system.id);
      throw error;
    }
    return () => systems.get(system.id) === system && remove(system.id);
  }

  return {
    add,
    remove,
    afterPlayerUpdate(deltaTime) {
      for (const system of [...systems.values()]) {
        if (systems.get(system.id) === system) system.afterPlayerUpdate?.(deltaTime, context);
      }
    },
    update(deltaTime) {
      for (const system of [...systems.values()]) {
        if (systems.get(system.id) === system) system.update?.(deltaTime, context);
      }
    },
    list() {
      return [...systems.keys()];
    },
  };
}
