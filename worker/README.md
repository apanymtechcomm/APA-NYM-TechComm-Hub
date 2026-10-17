# Confidential signup Worker

This Worker accepts `POST /v1/signup` for communication preferences and the distinct `POST /v1/event-rsvps` endpoint for event registration. Both store confidential details in D1. It intentionally has no public list, lookup, admin, or export route; review/export data only through authenticated Cloudflare tooling.

## Stored fields

- normalized email (unique and required)
- optional normalized name
- committee-email and event-notification preferences
- server-generated consent timestamp plus configured version and source
- status (`active`, with schema support for `unsubscribed` and `suppressed`)
- created/updated timestamps

The static site contains no signup records. Worker logs contain only an event name and random request ID—never email, name, IP, token, or request body.

Event RSVPs are stored separately from communication consent in `event_rsvps`: event slug, normalized email, required building-entry full name, required attendance mode, optional lab-interest and CM-credit choices, and created/updated timestamps. A repeated email for the same event updates that RSVP rather than creating a duplicate roster row.

## Controls

- exact CORS origin allowlist from `ALLOWED_ORIGINS`
- JSON-only requests and a 16 KiB streamed body limit
- normalized-email uniqueness with an upsert and the same generic success response for new and repeated signups
- mandatory Turnstile Siteverify call, including exact `action` and hostname allowlist checks
- Cloudflare Rate Limiting binding (10 attempts per 60 seconds per one-way-hashed anonymous fingerprint)
- D1 binding rather than Cloudflare REST calls
- Workers Logs and traces enabled; traces sampled at 5%
- no hardcoded secret: `TURNSTILE_SECRET` must be supplied through Wrangler secrets (or ignored `.dev.vars` locally)

## Local verification (no Cloudflare writes)

```bash
pnpm install
pnpm run cf:typegen
pnpm run worker:migrate:local
pnpm run worker:test
pnpm run worker:check
pnpm run worker:rsvp-roster:local
```

`worker:migrate:local` writes only Wrangler's ignored local state. `worker:check` is a packaging dry run and does not deploy. The local roster command prints CSV for in-person Nov. 19 attendees only. For the remote roster, first verify the active Cloudflare account and database, then run `pnpm exec tsx scripts/export-event-rsvp-roster.ts --remote --confirm-remote`; the explicit confirmation prevents accidental remote access. The same reviewed query is stored at `worker/queries/nov-19-building-roster.sql`.

## One-time Cloudflare setup — run only after publication approval

These commands are intentionally not run by this implementation because they create or modify external Cloudflare state.

1. Create D1 and copy its returned UUID:
   ```bash
   pnpm exec wrangler d1 create apa-nym-techcomm-signups
   ```
2. Replace the all-zero `database_id` in `wrangler.jsonc` with that UUID. Confirm rate-limit `namespace_id` `1001` is unused in the target account; choose a different positive integer if needed.
3. Create/configure a Turnstile widget for the GitHub Pages hostname. Keep the widget action as `signup`.
4. Enter the secret through Wrangler's masked prompt—never place it in source or a command argument:
   ```bash
   pnpm exec wrangler secret put TURNSTILE_SECRET
   ```
5. Apply the migration remotely:
   ```bash
   pnpm exec wrangler d1 migrations apply DB --remote
   ```
6. After reviewing the dry-run bundle, deploy:
   ```bash
   pnpm exec wrangler deploy
   ```
7. Set these public values in the site build environment and rebuild the static export:
   ```bash
   NEXT_PUBLIC_SIGNUP_API_URL=https://<worker-host>/v1/signup
   NEXT_PUBLIC_EVENT_RSVP_API_URL=https://<worker-host>/v1/event-rsvps
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=<public-site-key>
   ```
8. If a custom Pages hostname is added, add its exact origin to `ALLOWED_ORIGINS` and its hostname to `TURNSTILE_HOSTNAMES`, regenerate types, test, and dry-run before deployment.

Do not publish the Worker or GitHub Pages output without the repository's explicit per-run approval.
