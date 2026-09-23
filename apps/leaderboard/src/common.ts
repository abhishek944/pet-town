export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export const now = () => Math.floor(Date.now() / 1000);
export const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export const error = (message: string, status: number) => json({ error: message }, status);

export async function hash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function cookie(name: string, value: string, age: number): string {
  return `${name}=${value}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Lax`;
}

export function cookieValue(request: Request, name: string): string | null {
  const entry = request.headers
    .get("Cookie")
    ?.split("; ")
    .find((item) => item.startsWith(`${name}=`));
  return entry?.slice(name.length + 1) ?? null;
}

export function sameOrigin(request: Request): boolean {
  return request.headers.get("Origin") === new URL(request.url).origin;
}

export async function currentUser(request: Request, env: Env): Promise<string | null> {
  const token = cookieValue(request, "pt_session");
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const row = await env.DB.prepare(
    "SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?",
  )
    .bind(await hash(token), now())
    .first<{ user_id: string }>();
  return row?.user_id ?? null;
}
