# APA NYM TechComm Website (PROJ-033)

Standalone Payload CMS deployment of the APA New York Metro Chapter Technology
Committee website — ported from the static GitHub Pages site
(`apanymtechcomm/APA-NYM-TechComm-Hub`). DevOS project: **PROJ-033**.

## Stack

- Payload CMS 3.90.2 (website template) + Next.js 16.3.3 + React 19, SQLite (repo-local `file:./apa-nym-techcomm-website.db`), pnpm
- Dev/admin server on **:3115** (`scripts/dev.sh`); static export to `dist/` for GitHub Pages under `/APA-NYM-TechComm-Hub/`

## Content model

| Where | What |
|---|---|
| `hero-slides` | Homepage hero carousel (order via sortOrder; `bgImage` optional) |
| `events` | Tech Tables etc. — date, time string, location, hybrid, CM credits, RSVP URL, status, `featured` |
| `newsletters` | BYTE BY BYTE issues — volume/season/issueLabel/cover/richText body, optional external URL |
| `resources` | Curated external links (title, description, linkLabel, linkUrl) |
| `members` | Roster with role tiers (co-chair/secretary/advisor/member) |
| `homepage` (global) | Cards section; Events card auto-shows the next upcoming event |
| `sponsors` (global) | Events-page sponsor pitch + logo slots |
| `header`/`footer` (globals) | Site title/subtitle, nav, footer text |

## Commands (use the wrappers, not raw pnpm)

```bash
scripts/install.sh          # first install (CI=true pnpm install)
scripts/dev.sh              # dev server http://127.0.0.1:3115 (admin /admin)
scripts/regen-types.sh      # payload-types.ts (CLI generate:types HANGS here)
scripts/build-static.sh     # static export -> dist/ (GitHub Pages shape)
scripts/seed.ts             # idempotent content seed:
#   NODE_ENV=production node_modules/.bin/tsx scripts/seed.ts
```

## Publish (user-gated)

`dist/` is a GitHub-Pages-shaped static export (basePath `/APA-NYM-TechComm-Hub`,
all routes pre-rendered, media statically served via `mediaUrl`). Publishing
means pushing to `apanymtechcomm/APA-NYM-TechComm-Hub` — that replaces the live
Pages site, so it is an explicit human step every time.

## Conventions

- Content ops via Local API seed scripts (`scripts/seed.ts` pattern, NODE_ENV=production), never hand-edit the SQLite DB.
- revalidate hooks route through `src/utilities/safeRevalidate.ts` (Local API scripts have no request context).
- Media srcs always go through `src/utilities/mediaUrl.ts` (`/api/media/file/*` → `/media/*` + basePath) so the static export works.
- `notes/DEVLOG.md` — append a dated entry per development round.