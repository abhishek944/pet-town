import {
  cookie,
  cookieValue,
  currentUser,
  error,
  hash,
  json,
  now,
  randomToken,
  sameOrigin,
  type Env,
} from "./common";

export async function startLogin(request: Request, env: Env): Promise<Response> {
  const state = randomToken();
  const redirect = new URL("https://github.com/login/oauth/authorize");
  redirect.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  redirect.searchParams.set("redirect_uri", `${new URL(request.url).origin}/auth/callback`);
  redirect.searchParams.set("scope", "read:user");
  redirect.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirect.toString(),
      "Set-Cookie": cookie("pt_oauth", state, 600),
      "Cache-Control": "no-store",
    },
  });
}

export async function finishLogin(request: Request, env: Env): Promise<Response> {
  const query = new URL(request.url).searchParams;
  const state = cookieValue(request, "pt_oauth");
  const code = query.get("code");
  if (!state || state !== query.get("state") || !code) return error("Login state expired", 400);
  const exchanged = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  if (!exchanged.ok) return error("GitHub login failed", 502);
  const credential = (await exchanged.json()) as { access_token?: string };
  if (!credential.access_token) return error("GitHub login failed", 502);
  const profileResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${credential.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Pet-Town-Leaderboard",
    },
  });
  if (!profileResponse.ok) return error("GitHub profile unavailable", 502);
  const profile = (await profileResponse.json()) as {
    id?: number;
    login?: string;
    name?: string;
    avatar_url?: string;
  };
  if (!profile.id || !profile.login) return error("GitHub profile incomplete", 502);
  const userId = String(profile.id);
  await env.DB.prepare(
    `INSERT INTO users (id, github_login, display_name, avatar_url, created_at)
    VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET github_login=excluded.github_login,
    display_name=excluded.display_name, avatar_url=excluded.avatar_url`,
  )
    .bind(
      userId,
      profile.login,
      profile.name?.slice(0, 80) || profile.login,
      profile.avatar_url || "",
      now(),
    )
    .run();
  const session = randomToken();
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await hash(session), userId, now() + 30 * 86400)
    .run();
  const headers = new Headers({ Location: "/", "Cache-Control": "no-store" });
  headers.append("Set-Cookie", cookie("pt_session", session, 30 * 86400));
  headers.append("Set-Cookie", cookie("pt_oauth", "", 0));
  return new Response(null, { status: 302, headers });
}

export async function me(request: Request, env: Env): Promise<Response> {
  const id = await currentUser(request, env);
  if (!id) return json({ user: null });
  const user = await env.DB.prepare(
    "SELECT id, github_login, display_name, avatar_url FROM users WHERE id = ?",
  )
    .bind(id)
    .first();
  return json({ user });
}

export async function issueToken(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request)) return error("Invalid origin", 403);
  const id = await currentUser(request, env);
  if (!id) return error("Sign in first", 401);
  const token = randomToken();
  await env.DB.prepare(
    "INSERT INTO ingest_tokens (token_hash, user_id, created_at) VALUES (?, ?, ?)",
  )
    .bind(await hash(token), id, now())
    .run();
  return json({ token });
}

export async function logout(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request)) return error("Invalid origin", 403);
  const token = cookieValue(request, "pt_session");
  if (token)
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await hash(token))
      .run();
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": cookie("pt_session", "", 0) },
  });
}

export async function revokeTokens(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request)) return error("Invalid origin", 403);
  const id = await currentUser(request, env);
  if (!id) return error("Sign in first", 401);
  await env.DB.prepare(
    "UPDATE ingest_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
  )
    .bind(now(), id)
    .run();
  return json({ revoked: true });
}

export async function deleteAccount(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request)) return error("Invalid origin", 403);
  const id = await currentUser(request, env);
  if (!id) return error("Sign in first", 401);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM usage_events WHERE user_id = ?").bind(id),
    env.DB.prepare("DELETE FROM ingest_tokens WHERE user_id = ?").bind(id),
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id),
    env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id),
  ]);
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": cookie("pt_session", "", 0) },
  });
}
