# Credentials and hosting

Players supply personal Jev keys. Keys are never embedded in the build, server environment, deployment config, responses, URLs, or logs. On relay hosting, the browser sends the key over same-origin HTTPS to the game host; that host forwards it only to `https://api.typesafe.ai/v1/systemone`. Host the game on an origin and provider you trust. The loopback preview uses HTTP only on 127.0.0.1.

The relay accepts only game state, validates it and builds a bounded decision request. It cannot target arbitrary upstream URLs or use a shared owner's key. It requires a matching Origin, JSON, a bearer key, and a body under 32 KiB. Origin checks protect against browser cross-site requests; they are not authentication against non-browser clients. Each caller supplies their own provider credential. Provider requests have a four-second timeout, omit cookies/referrers and reject redirects. Upstream response bodies are excluded from errors.

By default keys stay in sessionStorage; Remember uses localStorage. Browser storage is not encrypted secret storage. Same-origin scripts, browser extensions or someone with profile access may read it. Use revocable personal keys and provider usage limits. Key settings clears the password field and cancels in-flight browser requests; requests already accepted by the provider may still consume usage. Storage failures are reported.

Cloudflare observability is disabled in the supplied config. Do not add request/header logging. Static security headers restrict scripts and network destinations. The bare static deployment's direct Jev mode requires provider CORS permission; relay deployments use normal server-to-server requests without disabling browser protections.

Use Workers Free for the documented hosting quotas; do not enable paid upgrades or paid bindings if zero hosting cost is required. Model inference charges are separate. No account-wide API key is shared with public visitors.

The deployed Worker applies an approximate 120 requests/minute limit per Cloudflare client IP per location before parsing `/api/plan` bodies. This uses Cloudflare's rate-limit binding, not an in-memory counter. Shared networks share the allowance. Missing rate-limit configuration fails closed. Rejected requests still invoke the Worker and count toward its quota; this cannot guarantee availability against distributed spam. There is no shared Jev key for callers to spend. Remaining financial protection depends on keeping the account on Workers Free, rather than upgrading to a paid plan.
