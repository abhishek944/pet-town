import { invoke } from "@tauri-apps/api/core";

const MICROPHONE_TIMEOUT_MS = 20_000;
const CONNECTION_STAGE_TIMEOUT_MS = 15_000;

function boundedStage<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
  isCurrent: () => boolean,
  discardLate: (value: T) => void = () => {},
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      settled = true;
      reject(new Error(timeoutMessage));
    }, timeoutMs);
    void Promise.resolve()
      .then(() => {
        if (!isCurrent()) throw new Error("Live voice setup was canceled.");
        return operation();
      })
      .then(
        (value) => {
          if (settled || !isCurrent()) {
            discardLate(value);
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              reject(new Error("Live voice setup was canceled."));
            }
            return;
          }
          settled = true;
          clearTimeout(timer);
          resolve(value);
        },
        (reason) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(reason);
        },
      );
  });
}

/** Browser operations cannot be aborted, so late microphone grants are explicitly released. */
export function createLiveStartup(isCurrent: () => boolean) {
  return {
    microphone(): Promise<MediaStream> {
      return boundedStage(
        () =>
          navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          }),
        MICROPHONE_TIMEOUT_MS,
        "Microphone access timed out. Check Pet Town microphone permission, then call Mayor again.",
        isCurrent,
        (stream) => stream.getTracks().forEach((track) => track.stop()),
      );
    },
    connection<T>(operation: () => Promise<T>, step: string): Promise<T> {
      return boundedStage(
        operation,
        CONNECTION_STAGE_TIMEOUT_MS,
        `Live connection setup timed out while ${step}. Call Mayor again to retry.`,
        isCurrent,
      );
    },
  };
}

/** Diagnostics must not keep voice setup waiting on a separate IPC request. */
export function reportLiveStartup(message: string): void {
  void invoke("report_orchestrator_diagnostic", { message }).catch(() => {});
}
