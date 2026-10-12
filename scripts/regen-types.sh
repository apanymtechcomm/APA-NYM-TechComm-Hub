#!/usr/bin/env bash
# Regenerate src/payload-types.ts via Payload's own generateTypes() (CLI generate:types HANGS here).
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/env.sh"

[ -f node_modules/.bin/tsx ] || { echo "ERROR: tsx missing — run: pnpm install" >&2; exit 1; }
node_modules/.bin/tsx scripts/regen-types.ts
[ -s src/payload-types.ts ] || { echo "ERROR: payload-types.ts empty/missing" >&2; exit 1; }
echo "OK: $(wc -l < src/payload-types.ts) lines"