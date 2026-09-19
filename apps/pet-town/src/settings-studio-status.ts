import { invoke } from "@tauri-apps/api/core";

type ApiStatus = { available: boolean; message: string };

export async function loadStudioApiStatus(): Promise<boolean> {
  const output = document.getElementById("studio-api-status")!;
  try {
    const status = await invoke<ApiStatus>("pet_studio_status");
    output.textContent = status.message;
    output.dataset.ready = String(status.available);
    return status.available;
  } catch {
    output.textContent = "OpenAI API key status unavailable";
    output.dataset.ready = "false";
    return false;
  }
}
