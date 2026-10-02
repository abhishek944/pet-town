/** Native connection flags are separate from a requested or active conversation. */
export function liveMayorStatus(mayor = {}) {
  const connected = Boolean(mayor.liveConnected);
  const connecting = !connected && Boolean(mayor.connecting || mayor.wakeActivated);
  const error = mayor.degradedNote || "";
  let phase = "Live voice stopped";
  let message = "Start Live voice to talk.";
  if (connecting) {
    phase = "Connecting Live voice";
    message = mayor.wakeStatus || "Connecting to Live voice…";
  } else if (connected) {
    phase = "Live voice connected";
    message = "Connected to Live voice.";
    if (mayor.speaking) {
      phase = "Speaking";
      message = "Mayor is speaking.";
    } else if (mayor.working) {
      phase = "Working";
      message = "Firstmate is working…";
    } else if (mayor.listening) {
      phase = "Listening";
      message = "Mayor is listening.";
    }
  }
  if (error) {
    phase = "Live voice error";
    message = error;
  }
  return {
    connected,
    connecting,
    sessionActive: connected || connecting,
    phase,
    message,
    error,
    startLabel: connecting
      ? "Connecting Live voice…"
      : connected
        ? "Live voice connected"
        : error
          ? "Retry Live voice"
          : "Start Live voice",
  };
}
