/** Own only button-started recording. Global Control+Option belongs to native code. */
export function createMayorTalk(bridge, state, render) {
  let starting = null;
  let releasing = null;
  let observedRecording = false;

  async function start() {
    if (state.ownsTalk || releasing) return;
    state.ownsTalk = true;
    observedRecording = false;
    render();
    const request = bridge.action("mayorTalk", { active: true });
    starting = request;
    try {
      await request;
    } catch (error) {
      // A rejected IPC request must not leave an ambiguously accepted native claim behind.
      await release();
      throw error;
    } finally {
      if (starting === request) starting = null;
      render();
    }
  }

  async function release(force = false) {
    if (releasing) return releasing;
    if (!state.ownsTalk && !force) return;
    state.releasingTalk = true;
    render();
    const request = (async () => {
      // A blur can arrive while native recording starts; release after its acknowledgement.
      try {
        await starting;
      } catch {
        /* Still release any native microphone claim. */
      }
      await bridge.action("mayorTalk", { active: false });
      state.ownsTalk = false;
      observedRecording = false;
    })();
    releasing = request;
    try {
      await request;
    } finally {
      if (releasing === request) releasing = null;
      state.releasingTalk = false;
      render();
    }
  }

  async function observe(mayor) {
    if (!state.ownsTalk || starting || releasing || !mayor) return;
    // Fresh native claim state covers rejected starts, even before listening was observed.
    if (mayor.townTalkRequested === false) return release();
    if (mayor.listening) {
      observedRecording = true;
      return;
    }
    // A listening transition also covers the thirty-second native recording limit.
    if (observedRecording) await release();
  }

  return { start, release, observe };
}
