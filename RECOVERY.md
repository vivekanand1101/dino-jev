# Project recovery

Recovered on 19 October 2026 from the original Codex game workspace into a standalone local Git repository. Original workspace files remain in place. Dino and tic-tac-toe have separate lockfiles and dependencies.

The initial recovery commit contains a local Express version. The later frontend conversion removes that application backend and replaces it with a static build, browser-local key settings, and direct Jev requests. `npm start` serves static files only. The source history remains available in Git.

No key was copied from the original workspace. No real key or paid inference was used for conversion checks. No GitHub repository was created or pushed. Kerai Rash is unchanged.

On 4 November 2026, live verification confirmed Jev rejects the local browser origin. Added a game-only same-origin relay shared by the local preview and Cloudflare Worker. The player supplies the credential; no shared provider key is deployed. Live testing cleared 23 obstacles with 20 Jev decisions. Deployment now includes an approximate per-IP request limit. The current source is being published to the private `vivekanand1101/dino-jev` repository.
