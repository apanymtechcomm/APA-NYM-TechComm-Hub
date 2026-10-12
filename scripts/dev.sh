#!/usr/bin/env bash
# Dev server on :3005 (admin at /admin). Port owned by PROJ-033.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/env.sh"
echo "apa-nym-techcomm-website dev -> http://localhost:3005 (admin: /admin)"
exec pnpm dev --port 3005 "$@"