import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const configFile = join(homedir(), ".pet-town", "leaderboard.json");
const pending = [];
let sending = false;

async function config() {
  try {
    const value = JSON.parse(await readFile(configFile, "utf8"));
    const url = new URL(value.url);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
    if (!/^[0-9a-f]{64}$/.test(value.token)) return null;
    return { url: new URL("/api/events", url).toString(), token: value.token };
  } catch {
    return null;
  }
}

async function flush() {
  if (sending || pending.length === 0) return;
  const target = await config();
  if (!target) return;
  sending = true;
  try {
    while (pending.length) {
      const batch = pending.slice(0, 50);
      const response = await fetch(target.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${target.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) break;
      pending.splice(0, batch.length);
    }
  } catch {
    /* A later completed message retries this batch. */
  } finally {
    sending = false;
  }
}

export default function leaderboard(pi) {
  pi.on("message_end", async (event, ctx) => {
    const message = event.message;
    if (message.role !== "assistant" || !message.usage) return;
    const usage = message.usage;
    if (!Number.isFinite(usage.input) || !Number.isFinite(usage.output)) return;
    pending.push({
      eventId: randomUUID(),
      provider: message.provider || "unknown",
      model: message.responseModel || message.model || "unknown",
      thinking: ctx.thinkingLevel || "unknown",
      inputTokens: usage.input,
      outputTokens: usage.output,
      cacheReadTokens: usage.cacheRead || 0,
      cacheWriteTokens: usage.cacheWrite || 0,
      estimatedCostUsd: usage.cost?.total || 0,
    });
    await flush();
  });
}
