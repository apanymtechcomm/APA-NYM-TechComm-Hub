# Development Log

Append-only log of each round of development on this repo (part of DevOS
project **PROJ-033**). New entries go at the top.

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