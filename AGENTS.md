# AGENTS.md — APA NYM TechComm Website (PROJ-033)

Managed by DevOS (canonical repo protocol).

## Rules
- All development work on this repo is tracked in DevOS as project **PROJ-033**.
- Before working: `devos doctor PROJ-033` (drift audit) and read the latest
  `notes/DEVLOG.md` entry to pick up current state and conventions.
- Find-before-create: query DevOS (`devos list --project PROJ-033`) before filing work.
- After each round of development, append a dated entry to `notes/DEVLOG.md`
  (summarize what was built, key commit hashes, verification, follow-ups).
- Never duplicate work already tracked in DevOS.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
