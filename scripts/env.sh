#!/usr/bin/env bash
# Shared environment for apa-nym-techcomm-website scripts. SOURCE this, do not exec it.
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  set +u
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use 24 >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true
  set -u
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
export REPO_ROOT

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm not on PATH." >&2
  exit 1
fi