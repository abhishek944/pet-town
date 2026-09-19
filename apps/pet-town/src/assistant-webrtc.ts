export function iceComplete(peer: RTCPeerConnection): Promise<void> {
  if (peer.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("WebRTC setup timed out.")), 10_000);
    peer.addEventListener("icegatheringstatechange", () => {
      if (peer.iceGatheringState === "complete") {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

export function installReleaseGuards(button: HTMLElement, release: () => void): void {
  button.addEventListener("keyup", release);
  button.addEventListener("blur", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
  window.addEventListener("keyup", (event) => {
    if (event.key === " " || event.key === "Enter") release();
  });
  window.addEventListener("blur", release);
}
