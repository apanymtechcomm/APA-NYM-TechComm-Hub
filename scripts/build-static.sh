#!/usr/bin/env bash
# Static export of the public site to dist/ for GitHub Pages
# (repo apanytechcomm/APA-NYM-TechComm-Hub, served under /APA-NYM-TechComm-Hub/).
#
# Two-mode build: BUILD_MODE=static -> next.config.ts sets output:'export',
# distDir 'dist', basePath '/APA-NYM-TechComm-Hub', unoptimized images.
# Non-exportable routes are STASHED outside the repo for the build and restored
# with an EXIT trap (a failed build must never leave them vanished):
#   - src/app/(payload)                    -> admin/API group (top level)
#   - src/app/(frontend)/{next,(sitemaps),posts,search,[slug]}
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/env.sh"

STASH="$(mktemp -d "${TMPDIR:-/tmp}/apany-static-stash.XXXXXX")"
declare -a ORIG=()

restore() {
  for orig in "${ORIG[@]}"; do
    if [ -e "$STASH/$(basename "$orig")" ] && [ ! -e "$orig" ]; then
      mv "$STASH/$(basename "$orig")" "$orig"
    fi
  done
  rm -rf "$STASH"
}
trap restore EXIT

add_stash() {
  [ -e "$1" ] || { echo "ERROR: $1 missing — did a previous stash fail to restore? Look in ${TMPDIR:-/tmp}" >&2; exit 1; }
  mv "$1" "$STASH/"
  ORIG+=("$1")
}

add_stash "src/app/(payload)"
for d in next "(sitemaps)" posts search "[slug]"; do
  add_stash "src/app/(frontend)/$d"
done

BUILD_MODE=static \
NEXT_PUBLIC_BASE_PATH=/APA-NYM-TechComm-Hub \
NEXT_PUBLIC_SERVER_URL=https://apanytechcomm.github.io \
./node_modules/.bin/next build

restore
trap - EXIT

echo "OK: dist/ built"
ls dist/ | head -30