# Dino × Jev

Play: https://anandvivek.in/slops/dino/

Standalone game: https://dino-jev.vivekanand1101.workers.dev/

Source: https://github.com/vivekanand1101/dino-jev (private).

The original Chromium dinosaur runner, with Jev selecting timed movement plans.

## Run locally

Use Node.js 24 LTS (or 22.9+).

```sh
npm ci --ignore-scripts
npm run dev
```

Open http://127.0.0.1:3038. Supply your own Jev key in the browser, then choose **Let Jev play**. **Play manually** works without a key: Space jumps and ArrowDown ducks. The key stays in this tab by default; **Remember on this device** persists it in your browser. **Key settings** replaces or clears it. Never put a real key into source files or the static build.

The local preview and deployed Worker expose the same game-only `/api/plan` relay. Browsers send the current runner state and their personal key to their own game host. The relay validates the state, generates legal plans, and asks the fixed Jev endpoint to select one. It keeps no keys, sends no cookies, rejects redirects and cross-origin browser calls, limits request bodies, and omits upstream error bodies. No shared owner key, database, paid hosting service, or environment file is needed. The deployed API has an approximate 120 requests/minute limit per client IP per Cloudflare location; public traffic can still exhaust the Free quota.

Direct browser requests to Jev failed preflight on 4 November 2026 with `Disallowed CORS origin`. The relay resolves this using an ordinary server-to-server API call. Plain static hosting remains usable for manual play; AI play without the relay requires Jev to allow that site's origin.

## Deploy on Cloudflare Workers Free

Use a Cloudflare account on the **Free** plan. The included `wrangler.jsonc` deploys the static game and relay together at a free `workers.dev` address. No custom domain is required.

```sh
npm ci --ignore-scripts
npx wrangler@4 login
npx wrangler@4 deploy
```

Wrangler runs the build automatically. Do not upload `.env` files or embed your key. Each visitor enters their own Jev key. The browser sends that key through the host running this Worker to Jev; deploy only to a host you trust.

Cloudflare's documented Free allocation is 100,000 Worker requests/day and 10 ms CPU/request; static asset requests are free and unlimited. Stay on Free to avoid hosting charges; quota exhaustion limits service. Jev inference usage is separate and follows each player's existing account and pricing. This project cannot guarantee free model inference.

Sources: https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/workers/static-assets/

## Verify

```sh
npm test
```

Tests mock Jev and cover gameplay, credentials, direct API access, relay origin/body/state validation, error handling, and the Worker entrypoint. No live key is required for tests.

The Chromium runner and sprites are pinned to Chromium 90.0.4430.212. BSD licensing is preserved in `public/vendor/LICENSE`. Source: https://github.com/chromium/chromium/tree/90.0.4430.212/components/neterror/resources

The website serves the game directly at `/slops/dino/`, without an iframe. After `npm run build`, run `node scripts/export-website.mjs /path/to/website` to update its `public/slops/dino/` assets. The website browser sends Jev decisions to this Worker. CORS allows only `https://anandvivek.in`; all requests still require a personal key and share the per-IP request limit. Keys on the website are scoped to the anandvivek.in origin. Website and game deployments are independent.
