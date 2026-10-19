# Dino × Jev

The Chromium dinosaur runner with optional Jev AI control. Runs independently from tic-tac-toe.

## Run

Use Node.js 24 LTS (see `.nvmrc`; Node 22.9+ also works).

```sh
npm ci --ignore-scripts
npm run build
npm start
```

Open http://127.0.0.1:3038. Press Space to start/jump and Down to duck. Manual play works without credentials. `npm run dev` starts the development watcher; `npm test` builds and runs the tests.

For AI play, copy `.env.example` to `.env`, set `TYPESAFE_API_KEY`, and restart. `.env` loads automatically. `JEV_API_KEY` is an alias, `JEV_MODEL` defaults to `jev-latest`, and `PORT` defaults to `3038`. Click **Let Jev play**; **Take over** releases its keys. Jev calls use your provider account and may incur costs. No key is included in this repository.

## How it works

The browser sends the runner's position, jump state, held keys, and up to three obstacles to `POST /api/action`. Local logic builds candidate timed keyboard plans; Jev chooses a plan, and the controller executes it while gameplay continues at normal speed. Selected policies may be reused for matching obstacles. Keep the game tab focused: Chromium pauses on lost focus.

`GET /health` reports `{configured, model}`. Invalid state returns 400, wrong content type 415, oversized JSON 413, missing key 503, rate/concurrency limit 429, and upstream failure 502. Requests are limited to 300 per minute and two in flight per process. Jev is tested with mocked responses; verification during recovery made no paid API calls.

## Source and verification

The original Chromium runner and sprites are pinned to Chromium 90.0.4430.212. Its BSD license is preserved in `public/vendor/LICENSE`. Original source: https://github.com/chromium/chromium/tree/90.0.4430.212/components/neterror/resources

Tests cover the controller, planner, state validation, upstream handling, browser protections, and inference limits. See `SECURITY.md` for local security assumptions and `RECOVERY.md` for recovery details.
