# Project recovery

Recovered on 19 October 2026 from the original Codex game workspace into a standalone local Git repository. Original workspace files remain in place. Dino and tic-tac-toe have separate lockfiles and dependencies.

The initial recovery commit contains a local Express version. The later frontend conversion removes that application backend and replaces it with a static build, browser-local key settings, and direct Jev requests. `npm start` serves static files only. The source history remains available in Git.

No key was copied from the original workspace. No real key or paid inference was used for conversion checks. No GitHub repository was created or pushed. Kerai Rash is unchanged.

On 4 November 2026, live verification confirmed Jev rejects the local browser origin. Added a game-only same-origin relay shared by the local preview and Cloudflare Worker. The player supplies the credential; no shared provider key is deployed. Live testing cleared 23 obstacles with 20 Jev decisions. Deployment now includes an approximate per-IP request limit. The current source is published to the private `vivekanand1101/dino-jev` repository.

Deployed on 4 November 2026 to `https://dino-jev.vivekanand1101.workers.dev/`, after confirming Workers Free was the current account plan. Deployment version: `d0190e7e-462a-4bd1-bf96-c11f08e79192`. Static assets and the game-only relay run on the same host, with no provider secret configured on the Worker.

The first live Worker check caught Cloudflare’s lack of support for `redirect: error`. The Jev transport now uses manual redirect handling and explicitly rejects redirect responses; a regression test covers both runtime compatibility and credential-safe redirect rejection.
