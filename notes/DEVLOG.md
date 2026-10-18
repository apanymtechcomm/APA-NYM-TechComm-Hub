# Development Log

Append-only log of each round of development on this repo (part of DevOS
project **PROJ-033**). New entries go at the top.

## Round 7 — 2026-10-17 · Native Nov. 19 event RSVP (DEV-305)

- Added a dedicated `/events/november-19-2026/rsvp` page and `POST /v1/event-rsvps` Worker endpoint, separate from newsletter/committee consent. The form requires email, the attendee’s full building-entry name, and one of four attendance modes; lab-interest and CM-credit responses are optional. A prominent November 18 notice explains that late or unlisted attendees must join virtually, and the Worker rejects in-person submissions after the end of November 18 EST while continuing to accept virtual attendance.
- Added D1 migration `0002_create_event_rsvps.sql` with per-event/email upserts, strict attendance/optional-choice checks, and roster indexes. Added an authenticated-tooling-only CSV roster exporter for in-person attendees, a reviewed SQL query, local-by-default behavior, and an explicit `--confirm-remote` guard. No public read endpoint was added.
- Updated the Payload DB event and `scripts/seed.ts` to `registration-open` with the native RSVP route; updated the events CTA to preserve the GitHub Pages base path. No venue or hybrid-access URL was invented.
- Verification: 30/30 focused Worker/form tests passed; app and Worker TypeScript passed; focused ESLint reported 0 errors (the existing events page still has 2 `any` warnings); both D1 migrations applied locally; a local probe verified all 9 schema columns and in-person CSV output, then was deleted with 0 probe rows remaining; Wrangler dry-run packaged 12.97 KiB (3.80 KiB gzip); static export generated 11/11 pages including the RSVP route; 11/11 exact export checks passed. No commit, push, remote migration, Worker deploy, Pages publish, or secret change was performed.

## Round 6 — 2026-10-17 · November Tech Table event (DEV-305)

- Replaced the placeholder Fall Tech Table content with the Thursday, November 19, 2026 agenda for “No Cloud Required Part 2,” including the hands-on open-source AI agents/Hermes lab, one CM credit, happy-hour-only attendance option, and the November 18 full-name deadline for building entry.
- Audited the existing confidential signup system. It collects email plus an optional name and communication preferences, but it cannot require full name or record in-person, virtual, or happy-hour-only attendance. The event therefore has no invented RSVP URL; upcoming events without one render a visible “RSVP link coming soon” placeholder. Venue and virtual access details remain explicitly unannounced.
- Verification: Payload Local API upsert and independent readback confirmed DB record ID 3 and all 10 event fields; `pnpm exec tsc --noEmit` passed; `scripts/build-static.sh` generated all 10 routes; exact export checks passed 8/8 strings on `dist/events/index.html` and 6/6 event-summary strings on `dist/index.html`. No commit, push, publication, Worker change, or deployment performed.

## Round 5 — 2026-10-16 · Committee governance and open roles

- Reworked `/members` as the Committee page while preserving Andrew Buck as the sole current member card; added four clearly unfilled cards for Co-Chair, Secretary, Treasurer, and Communications plus the `apa.techcomm@gmail.com` interest CTA.
- Grounded each two-sentence role summary in the official Committee bylaws draft and added `docs/committee-governance.md`, which records both official sources and distinguishes the draft Committee document from the adopted Chapter bylaws. Vacancies remain code-defined governance content rather than fictional Payload member records; the seed continues to contain only Andrew.
- Verification: app and Worker TypeScript passed; focused ESLint passed; the static export built all 10 routes; programmatic export checks found exactly one member card (Andrew), four expected vacancy cards, four two-sentence descriptions, and the mailto CTA; the local dev page returned 200 and browser-rendered the same exact card set. No commit, push, publication, or Cloudflare change was performed; `notes/dev-server.log` remains untouched pre-existing local output.

## Round 4 — 2026-10-16 · Signup system deployed live (DEV-299 DONE)

- Deployed with Andrew's explicit approval: D1 `apa-nym-techcomm-signups` (`894bd4c7-5b43-4a97-9129-c844b707a6a4`) created and remote migration applied; Turnstile widget `apanymtechcomm-signup-v2` (sitekey `0x4AAAAAAFYwLlgRW3Q8OeF-`); secret stored via `wrangler secret put` stdin. First widget's secret leaked into a tool transcript — rotated by recreating the widget and deleting the exposed one.
- Worker `apa-nym-techcomm-signup` deployed on custom domain **signup.abucks.world** (account zone `abucks.world`). `workers.dev` is TLS-blocked on this network (handshake failure from both WSL and Windows), so the custom domain is the production endpoint; workers.dev subdomain `abuck-workers` was registered as fallback.
- Negative probes on live API: GET / 404, GET /v1/signup 405, POST bad origin 403, oversized 413, missing/fake Turnstile token 400, generic messages only; preflight returns exact GitHub Pages origin. D1 stayed at 0 rows through all probes.
- Static export rebuilt with `NEXT_PUBLIC_SIGNUP_API_URL` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, leak-scanned clean, `.nojekyll` added, published to `gh-pages` via the orphan-repo flow. Live contact page serves the form; real browser signup (Turnstile solved non-interactively) wrote a consent-stamped D1 row; probe row deleted after readback (table back to 0). Build gotcha: run `scripts/build-static.sh`, never bare `next build` (unstashed `(payload)`/`next` routes break `output: export`).
- Not committed: intentional diff is 19 tracked files + new worker/wrangler/test files; `notes/dev-server.log` remains pre-existing dirty.

## Round 3 — 2026-10-16 · Confidential signup Worker and public form

- Added a static-site signup form backed by a Cloudflare Worker, D1, Turnstile, exact-origin CORS, a Cloudflare rate-limit binding, bounded JSON parsing, normalized/upserted records, consent metadata, structured non-PII logs, and no public read route. Suppressed records remain suppressed on later submissions.
- Added the D1 migration, Wrangler configuration/types, local/deployment runbook, public build variables, focused Worker/form tests, and fail-safe form copy when public settings are absent. The all-zero D1 ID remains an intentional pre-deployment placeholder.
- Corrected local/e2e port references to registered port `3115`, repaired the Next 16 flat ESLint configuration, and corrected the GitHub Pages owner hostname used by the static build. Removed build-generated `public/robots.txt` and `public/sitemap.xml`; `notes/dev-server.log` remains untouched pre-existing local output.
- Verification: 16/16 focused tests passed; app + Worker TypeScript passed; focused ESLint passed; Wrangler local migration and dry-run passed (8.81 KiB upload, 2.96 KiB gzip); static export produced 10 routes; 189 exported files passed configured-form, host, route-restore, and zero-secret-leak checks; a local D1 conflict probe confirmed suppressed status is preserved. Full-repo ESLint now executes but still reports pre-existing template issues outside this feature. Browser e2e remains unexecuted because Playwright revision 1208 is absent and two install attempts timed out.
- No commit, push, deploy, Cloudflare resource creation, remote migration, or Pages publication was performed. Next: create D1/Turnstile, replace the placeholder D1 ID, set the Worker secret and public build values, apply the remote migration, dry-run again, deploy only with approval, rebuild Pages, and complete a live signup/readback check.

## Round 2 — 2026-10-12 · Restore Payload admin through Tailscale

- Root cause: Next.js 16 dev-origin protection returned HTTP 403 for Payload admin client chunks requested through `vengeance.tail92bcba.ts.net`. The `/admin` HTML shell still returned 200, but React could not hydrate and the body remained blank.
- Fix: added `allowedDevOrigins: ['vengeance.tail92bcba.ts.net']` to `next.config.ts`; restarted `apa-nym-techcomm-website.service`.
- Verification: `pnpm exec tsc --noEmit` passed; `pnpm run build` exited 0 and generated all routes; browser navigation now redirects `/admin` to `/admin/login`, renders the login form, and loads 39/39 Next chunks with zero HTTP failures.
- Follow-up: the successful production build still emits a non-fatal resolver diagnostic for `../../../tailwind.config.mjs`; the file exists at repo root and compilation completes. The rendered dev page also reports a Next/React performance-measure error about a negative `Page` timestamp, without preventing render.

## Round 1 — 2026-10-12 · Standalone Payload build, full content port, static export

- Source: existing static GitHub Pages site (private repo `apanytechcomm/APA-NYM-TechComm-Hub`, cloned read-only). Pages: index (hero carousel + cards), about, members (roster), events (4 Tech Tables + sponsor band; data/events.json), newsletters (BYTE BY BYTE template issue), resources (8 entries), contact.
- Stack: Payload 3.90.2 website template + Next.js 16.3.3 + SQLite (`file:./apa-nym-techcomm-website.db`), pnpm. Dev server **:3005** (`scripts/dev.sh`).
- Content model: collections `events` (4), `newsletters` (1, richText body + cover), `resources` (8), `members` (14), `hero-slides` (4), `media` (4 — real upload rows from `seed-assets/`); globals `homepage` (cards; Events card auto-renders next upcoming event), `sponsors`, extended `header` (siteTitle/siteSubtitle/navItems), `footer` (footerText).
- Seed: `NODE_ENV=production node_modules/.bin/tsx scripts/seed.ts` — idempotent upserts. Verified: SEED COMPLETE {events:4, newsletters:1, resources:8, members:14, hero-slides:4, media:4}.
- Frontend port: header/footer chrome, hero carousel (client, arrows/dots/arrows-keys/translateX), cards section, and routes `/about /events /members /newsletters /newsletters/[slug] /resources /contact` with ported design tokens (`src/css/site.css`).
- Template de-brand: generateMeta/mergeOpenGraph/plugins generateTitle + `@payloadcms` twitter creator removed; OG image → `public/APA-NYM-TechComm-OG.png`.
- Static export (two-mode): `scripts/build-static.sh` (BUILD_MODE=static, basePath `/APA-NYM-TechComm-Hub`, route stash for `(payload)`, `(frontend)/{next,(sitemaps),posts,search,[slug]}`; EXIT-trap restore). Verified: 9 routes + media + `_next` chunk all 200 under a Pages-shaped static server; de-brand grep clean in `dist/`.
- Media on export: `src/utilities/mediaUrl.ts` rewrites `/api/media/file/*` → `/media/*` + basePath (Payload 3.90.2 has no `staticURL` upload option).
- Typecheck: `tsc --noEmit` clean (after regen-types via Payload's own `generateTypes()`).
- Decision: newsletter issue page renders as a styled article inside the site chrome (richText), NOT a wholesale port of the standalone issue HTML — the issue template's unique magazine layout is a candidate follow-up if fidelity is wanted.
- Behavior change vs. original: homepage Events card and /newsletters CTAs are now CMS-driven — the Events card shows the next upcoming event by date (currently **Fall Tech Table, Oct 22 2026**), replacing the original hardcoded "Spring Tech Table". Say the word if Spring-only carding is preferred.
- NEXT: baseline commit (this file), then push to `apanytechcomm/APA-NYM-TechComm-Hub` is USER-GATED (replaces the live Pages site).
## Round — 2026-10-17: Published Nov 19 Tech Table RSVP (user-approved)
- Remote D1 migration `0002_create_event_rsvps` confirmed applied (`event_rsvps` present, 9 columns; count 0).
- Worker deployed: version `444b298f-2332-4d01-b1ef-303980f81a14` at signup.abucks.world; empty POST → 400 (validation live).
- Static rebuild with `NEXT_PUBLIC_EVENT_RSVP_API_URL` + site key; 11/11 export assertions; published to `gh-pages` (92c7d2c → 2ba6868).
- Live verified: events page shows Nov 19 agenda + `RSVP →` CTA (basePath-correct); RSVP page serves API URL + Turnstile key; Pages source gh-pages, status building→live.
- Headless caveat: Turnstile challenge iframe does not render in the automation browser, so a token-validated live submission was not executed; client-side "complete the verification" path confirmed. Verify one real RSVP in a normal browser before relying on the roster.

## Round — 2026-10-17: Venue announced + membership invites
- Event ID 3 (fall-tech-table) location set to "VHB - One Penn Plaza, New York"; mirrored in scripts/seed.ts; tmp script removed.
- Rebuilt static (verified: "One Penn Plaza" present, "to be announced" 0 hits) and published gh-pages (a19e91f); live page verified showing venue.
- Membership email invite created as Gmail DRAFT r7548050468304647720 on apa.techcomm@gmail.com — 125 BCC'd membership emails from Grist, HTML body per Andrew's doc edits. Andrew sends it himself.

## Round — 2026-10-17: Site-broken incident — missing .nojekyll
- Symptom: live site unstyled, all `_next/*` assets 404. Root cause: venue republish omitted `touch dist/.nojekyll`, so GitHub Pages Jekyll excluded underscore dirs.
- Fix: republished gh-pages with .nojekyll (802265b); verified .nojekyll 200, CSS 200, venue text live.
- Prevention: build-static.sh now creates dist/.nojekyll itself.
