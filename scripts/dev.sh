#!/usr/bin/env bash
# Dev server on :3115 (admin at /admin). Port owned by PROJ-033.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/env.sh"
echo "apa-nym-techcomm-website dev -> http://localhost:3115 (admin: /admin)  [tailnet: https://vengeance.tail92bcba.ts.net:3115]"
# --hostname 127.0.0.1: binding * would grab the tailnet-facing socket and break
# the tailscale serve TLS proxy on the same port (WSL mirrored networking).
exec pnpm dev --port 3115 --hostname 127.0.0.1 "$@"