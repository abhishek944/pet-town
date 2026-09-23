# Pet Town leaderboard

A separate Cloudflare Worker + D1 app under `apps/`. It publishes a public leaderboard and accepts opt-in usage reports from a Pi extension, but Pet Town does not currently bundle or load that extension. GitHub OAuth identifies each participant. The Worker stores only GitHub display details and usage metadata; it never receives prompts, answers, tools, files, API keys, or the raw Pi session.

## Metrics

Each completed Pi assistant message reports provider, actual response model, current thinking level, fresh input tokens, output tokens, cache read and cache write tokens, and `usage.cost.total`. Pi calculates that last value from its local model catalog. The site calls it **estimated cost**. It is not a bill, especially for a ChatGPT/Codex subscription. Total tokens add the four categories. Cache hits rank cache read tokens. Filters cover rolling 7 days, rolling 30 days, and all time.

Reports are client supplied. Unique event IDs make retry idempotent, but users can alter their own client and submit false counts. Treat this as a friendly community board, not a prize or financial record. The extension retries failed reports during the current Pi process; reports can be lost if the process exits while offline. Voice model usage outside Pi is not included.

## Deploy

1. Create a D1 database: `pnpm --filter @pet-town/leaderboard exec wrangler d1 create pet-town-leaderboard`.
2. Put its `database_id` in `wrangler.jsonc`.
3. Apply the schema: `pnpm --filter @pet-town/leaderboard exec wrangler d1 execute pet-town-leaderboard --remote --file schema.sql` from the repo root.
4. Create a GitHub OAuth app. Set its callback URL to `https://YOUR_HOST/auth/callback`. Run `pnpm --filter @pet-town/leaderboard exec wrangler secret put GITHUB_CLIENT_ID` and the same command for `GITHUB_CLIENT_SECRET`. Do not commit either value.
5. Deploy with `pnpm --filter @pet-town/leaderboard deploy`. Set the resulting domain (or a custom domain) as the GitHub OAuth app's homepage and callback host.

For local development, use a separate local D1 database, put `GITHUB_CLIENT_ID` in `apps/leaderboard/.dev.vars`, and run `pnpm --filter @pet-town/leaderboard dev`. GitHub OAuth requires a callback reachable by the browser.

## Join from Pet Town

1. Open the deployed leaderboard and sign in with GitHub.
2. Generate a connection token. The token is shown once.
3. Save the displayed JSON to `~/.pet-town/leaderboard.json` with permissions `0600`.
4. Reporting is not currently wired into Pet Town's Pi launch. The standalone `pi-extension.mjs` remains here for later integration; saving the config alone will not submit usage.

No reporting happens without that config file. Revoke tokens from the site to stop ingestion; delete your account there to remove the stored profile and usage events. Remove the local config file as well when disconnecting a device.

## Data and security

The D1 tables are `users`, `sessions`, `ingest_tokens`, and `usage_events`. Browser sessions and ingest tokens are stored by SHA-256 digest, never in clear text. The browser session cookie is HttpOnly, Secure, and SameSite=Lax. Mutations made by the browser check the request origin. GitHub tokens are used once to fetch a profile and are not stored. D1 assigns the event receipt time, so clients cannot backdate a ranking period. Usage data has no automatic expiration; users can delete it through the app.
