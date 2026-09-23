import {
  deleteAccount,
  finishLogin,
  issueToken,
  logout,
  me,
  revokeTokens,
  startLogin,
} from "./auth";
import { error, type Env } from "./common";
import { ingest, leaderboard } from "./usage";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === "GET" && pathname === "/auth/github") return startLogin(request, env);
    if (request.method === "GET" && pathname === "/auth/callback") return finishLogin(request, env);
    if (request.method === "GET" && pathname === "/api/me") return me(request, env);
    if (request.method === "GET" && pathname === "/api/leaderboard")
      return leaderboard(request, env);
    if (request.method === "POST" && pathname === "/api/token") return issueToken(request, env);
    if (request.method === "POST" && pathname === "/api/logout") return logout(request, env);
    if (request.method === "POST" && pathname === "/api/token/revoke-all")
      return revokeTokens(request, env);
    if (request.method === "POST" && pathname === "/api/account/delete")
      return deleteAccount(request, env);
    if (request.method === "POST" && pathname === "/api/events") return ingest(request, env);
    if (pathname.startsWith("/api/") || pathname.startsWith("/auth/"))
      return error("Not found", 404);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
