import { error, hash, json, now, type Env } from "./common";

interface UsageEvent {
  eventId: string;
  provider: string;
  model: string;
  thinking: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  estimatedCostUsd: number;
}

const metrics = {
  total: "SUM(e.input_tokens + e.output_tokens + e.cache_read_tokens + e.cache_write_tokens)",
  input: "SUM(e.input_tokens)",
  output: "SUM(e.output_tokens)",
  cache: "SUM(e.cache_read_tokens)",
  cost: "SUM(e.estimated_cost_micros)",
} as const;

function validCount(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 2_000_000
  );
}

function validEvent(value: unknown): value is UsageEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.eventId === "string" &&
    /^[0-9a-f-]{36}$/.test(event.eventId) &&
    typeof event.provider === "string" &&
    event.provider.length > 0 &&
    event.provider.length <= 80 &&
    typeof event.model === "string" &&
    event.model.length > 0 &&
    event.model.length <= 120 &&
    typeof event.thinking === "string" &&
    event.thinking.length <= 24 &&
    validCount(event.inputTokens) &&
    validCount(event.outputTokens) &&
    validCount(event.cacheReadTokens) &&
    validCount(event.cacheWriteTokens) &&
    typeof event.estimatedCostUsd === "number" &&
    Number.isFinite(event.estimatedCostUsd) &&
    event.estimatedCostUsd >= 0 &&
    event.estimatedCostUsd <= 100
  );
}

export async function ingest(request: Request, env: Env): Promise<Response> {
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!/^[0-9a-f]{64}$/.test(token)) return error("Valid ingest token required", 401);
  const account = await env.DB.prepare(
    "SELECT user_id FROM ingest_tokens WHERE token_hash = ? AND revoked_at IS NULL",
  )
    .bind(await hash(token))
    .first<{ user_id: string }>();
  if (!account) return error("Invalid ingest token", 401);
  if (Number(request.headers.get("Content-Length")) > 64_000) return error("Batch too large", 413);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Invalid JSON", 400);
  }
  const events = (body as { events?: unknown })?.events;
  if (
    !Array.isArray(events) ||
    events.length === 0 ||
    events.length > 50 ||
    !events.every(validEvent)
  ) {
    return error("Expected 1 to 50 valid usage events", 400);
  }
  const statements = events.map((event: UsageEvent) =>
    env.DB.prepare(
      `INSERT OR IGNORE INTO usage_events
    (user_id, event_id, observed_at, provider, model, thinking, input_tokens, output_tokens,
     cache_read_tokens, cache_write_tokens, estimated_cost_micros)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      account.user_id,
      event.eventId,
      now(),
      event.provider,
      event.model,
      event.thinking,
      event.inputTokens,
      event.outputTokens,
      event.cacheReadTokens,
      event.cacheWriteTokens,
      Math.round(event.estimatedCostUsd * 1_000_000),
    ),
  );
  const results = await env.DB.batch(statements);
  return json({ accepted: results.reduce((count, result) => count + result.meta.changes, 0) });
}

export async function leaderboard(request: Request, env: Env): Promise<Response> {
  const query = new URL(request.url).searchParams;
  const metric = query.get("metric") || "total";
  const period = query.get("period") || "week";
  if (!(metric in metrics) || !["week", "month", "all"].includes(period))
    return error("Invalid filter", 400);
  const cutoff =
    period === "week" ? now() - 7 * 86400 : period === "month" ? now() - 30 * 86400 : 0;
  const expression = metrics[metric as keyof typeof metrics];
  const rows = await env.DB.prepare(
    `SELECT u.id, u.github_login, u.display_name, u.avatar_url,
    ${expression} AS score, COUNT(*) AS requests,
    SUM(e.input_tokens) AS input_tokens, SUM(e.output_tokens) AS output_tokens,
    SUM(e.cache_read_tokens) AS cache_read_tokens, SUM(e.cache_write_tokens) AS cache_write_tokens,
    SUM(e.estimated_cost_micros) AS estimated_cost_micros
    FROM usage_events e JOIN users u ON u.id = e.user_id
    WHERE e.observed_at >= ? GROUP BY u.id ORDER BY score DESC, u.id ASC LIMIT 100`,
  )
    .bind(cutoff)
    .all();
  return json({ metric, period, rows: rows.results });
}
