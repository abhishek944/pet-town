import { liveMayorStatus } from "./live-status.js";

export function renderMayorView(view, state) {
  const { fields, controls } = view;
  const mayor = state.snapshot?.mayor;
  const standard = (state.snapshot?.mode ?? "firstmate") === "firstmate";
  const live = liveMayorStatus(mayor);
  const connected = state.connection.connected;
  const active = connected && mayor?.active;
  const listening = active && (mayor.listening || state.ownsTalk);
  const busy = state.pending || mayor?.working || mayor?.speaking;
  const text = (field, value) => {
    if (fields[field].textContent !== value) fields[field].textContent = value;
  };
  text("name", mayor?.name || "Mayor");
  const phase = !connected
    ? "Desktop disconnected"
    : !active
      ? "Stopped"
      : !standard
        ? live.phase
        : listening
          ? "Listening"
          : mayor.speaking
            ? "Speaking"
            : mayor.working
              ? "Working"
              : mayor.voiceStatus || (standard ? "Standard mode" : "Live mode");
  text("phase", phase);
  const status = !connected
    ? state.connection.message
    : state.pending
      ? state.pending
      : !active
        ? "Start Mayor in Settings."
        : !standard
          ? live.message
          : mayor?.voiceStatus ||
            (mayor.firstmateOwned
              ? "Ready · call Mayor to talk."
              : "Open Settings to set up Mayor voice.");
  text("status", status);
  const error = state.error || (!standard && active ? live.error : "");
  fields.error.hidden = !error;
  text("error", error);
  fields.speech.hidden = !mayor?.speech;
  text("speech", mayor?.speech || "");
  fields.status.hidden = connected && active && !state.pending && !!mayor?.speech && !error;
  fields.hint.textContent = standard
    ? "⌥ M · Call Mayor · Hold Ctrl+Option to talk"
    : "⌥ M · Call Mayor";
  controls.mode.value = standard ? "firstmate" : "live";
  controls.mode.disabled = !connected || Boolean(state.pending);
  controls.follow.disabled = !active || Boolean(state.pending);
  controls.talk.textContent = standard
    ? listening
      ? "Stop and send"
      : "Start talking"
    : live.startLabel;
  controls.talk.disabled =
    !active ||
    state.releasingTalk ||
    Boolean(state.pending) ||
    (standard ? !listening && Boolean(busy) : live.sessionActive);
  controls.talk.hidden = !standard && live.sessionActive;
  controls.stop.hidden = standard || !live.sessionActive;
  controls.stop.textContent = live.connecting ? "Cancel connection" : "Stop voice";
  controls.stop.disabled = !active || !live.sessionActive || Boolean(state.pending);
  controls.retry.hidden = !standard;
  controls.retry.disabled =
    !active || Boolean(state.pending) || Boolean(mayor?.speaking) || Boolean(listening);
  controls.settings.disabled = !connected || Boolean(state.pending);
  controls.reconnect.hidden = connected;
  view.root.dataset.connected = String(connected);
  view.root.dataset.listening = String(Boolean(listening));
  view.root.dataset.liveConnected = String(!standard && live.connected);
  view.root.dataset.liveConnecting = String(!standard && live.connecting);
}
